import {
	isDirectRun,
	loadIds,
	type SeedDefinition,
	type SeedSummary,
	topUp,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import CategoryEntity from '@/features/category/category.entity';
import DiscountEntity, {
	type DiscountReason,
	DiscountReasonEnum,
	type DiscountRules,
	type DiscountScope,
	DiscountScopeEnum,
	type DiscountType,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';

const DAY_IN_MILLISECONDS = 86400 * 1000;

/**
 * Offsets, in days from now, for the discount window. `null` on either end means open-ended.
 * The set deliberately covers all four states the `IDX_discount_active` lookup has to tell
 * apart — running, scheduled, expired and always-on — so a demo list is not uniformly valid.
 */
type Window = readonly [startDays: number | null, endDays: number | null];

const WINDOW_RUNNING: Window = [-7, 21];
const WINDOW_SCHEDULED: Window = [14, 45];
const WINDOW_EXPIRED: Window = [-90, -30];
const WINDOW_OPEN: Window = [null, null];

type DiscountBlueprint = {
	/** Natural key: the coupon / referral code a client actually types. */
	reference: string;
	label: string;
	scope: DiscountScope;
	reason: DiscountReason;
	type: DiscountType;
	value: number;
	window: Window;
	/**
	 * Built per row rather than stored flat, because the meaningful rule keys follow the
	 * scope — a country discount is bounded by `applicable_countries`, an order one by
	 * `min_order_value` — and category rules need ids only known at run time.
	 */
	buildRules: (categoryIds: readonly number[]) => DiscountRules | undefined;
	notes: string | null;
};

const DISCOUNTS: readonly DiscountBlueprint[] = [
	{
		reference: 'FLASH10',
		label: 'Flash Sale 10%',
		scope: DiscountScopeEnum.ORDER,
		reason: DiscountReasonEnum.FLASH_SALE,
		type: DiscountTypeEnum.PERCENT,
		value: 10,
		window: WINDOW_RUNNING,
		buildRules: () => ({ min_order_value: 150 }),
		notes: 'Site-wide weekend campaign',
	},
	{
		reference: 'WELCOME25',
		label: 'Welcome Voucher',
		scope: DiscountScopeEnum.CLIENT,
		reason: DiscountReasonEnum.FIRST_TIME_CUSTOMER,
		type: DiscountTypeEnum.AMOUNT,
		value: 25,
		window: WINDOW_OPEN,
		buildRules: () => ({ min_order_value: 200 }),
		notes: 'First order only',
	},
	{
		reference: 'LOYAL5',
		label: 'Loyalty Reward 5%',
		scope: DiscountScopeEnum.CLIENT,
		reason: DiscountReasonEnum.LOYALTY_DISCOUNT,
		type: DiscountTypeEnum.PERCENT,
		value: 5,
		window: WINDOW_OPEN,
		buildRules: () => ({ min_order_count: 3 }),
		notes: null,
	},
	{
		reference: 'BDAY15',
		label: 'Birthday Treat 15%',
		scope: DiscountScopeEnum.CLIENT,
		reason: DiscountReasonEnum.BIRTHDAY_DISCOUNT,
		type: DiscountTypeEnum.PERCENT,
		value: 15,
		window: WINDOW_OPEN,
		buildRules: () => undefined,
		notes: 'Valid during the birthday month',
	},
	{
		reference: 'REFER20',
		label: 'Referral Bonus',
		scope: DiscountScopeEnum.CLIENT,
		reason: DiscountReasonEnum.REFERRAL_DISCOUNT,
		type: DiscountTypeEnum.AMOUNT,
		value: 20,
		window: WINDOW_RUNNING,
		buildRules: () => ({ min_order_value: 100 }),
		notes: 'Granted to the referring client',
	},
	{
		reference: 'VIP12',
		label: 'VIP Tier 12%',
		scope: DiscountScopeEnum.CLIENT,
		reason: DiscountReasonEnum.VIP_DISCOUNT,
		type: DiscountTypeEnum.PERCENT,
		value: 12,
		window: WINDOW_OPEN,
		buildRules: () => ({ client_tags: ['vip'] }),
		notes: null,
	},
	{
		reference: 'CAT20',
		label: 'Category Clearance 20%',
		scope: DiscountScopeEnum.CATEGORY,
		reason: DiscountReasonEnum.SPECIAL_DISCOUNT,
		type: DiscountTypeEnum.PERCENT,
		value: 20,
		window: WINDOW_RUNNING,
		buildRules: (categoryIds) =>
			categoryIds.length > 0
				? { eligible_categories: [...categoryIds] }
				: undefined,
		notes: 'Ends when the stock is out',
	},
	{
		reference: 'CATFIX30',
		label: 'Category Fixed Cut',
		scope: DiscountScopeEnum.CATEGORY,
		reason: DiscountReasonEnum.SPECIAL_DISCOUNT,
		type: DiscountTypeEnum.AMOUNT,
		value: 30,
		window: WINDOW_SCHEDULED,
		buildRules: (categoryIds) => {
			const rules: DiscountRules = { min_order_value: 250 };

			if (categoryIds.length > 0) {
				rules.eligible_categories = [...categoryIds];
			}

			return rules;
		},
		notes: null,
	},
	{
		reference: 'PROD7',
		label: 'Product Promo 7%',
		scope: DiscountScopeEnum.PRODUCT,
		reason: DiscountReasonEnum.SPECIAL_DISCOUNT,
		type: DiscountTypeEnum.PERCENT,
		value: 7,
		window: WINDOW_RUNNING,
		buildRules: () => undefined,
		notes: 'Linked to products through product_discount',
	},
	{
		reference: 'PRODLAUNCH',
		label: 'Launch Offer 18%',
		scope: DiscountScopeEnum.PRODUCT,
		reason: DiscountReasonEnum.FLASH_SALE,
		type: DiscountTypeEnum.PERCENT,
		value: 18,
		window: WINDOW_SCHEDULED,
		buildRules: () => undefined,
		notes: null,
	},
	{
		reference: 'RO8',
		label: 'Romania Shipping Offset',
		scope: DiscountScopeEnum.COUNTRY,
		reason: DiscountReasonEnum.SPECIAL_DISCOUNT,
		type: DiscountTypeEnum.AMOUNT,
		value: 8,
		window: WINDOW_OPEN,
		buildRules: () => ({
			applicable_countries: ['RO'],
			min_order_value: 120,
		}),
		notes: null,
	},
	{
		reference: 'EU5',
		label: 'EU Cross-Border 5%',
		scope: DiscountScopeEnum.COUNTRY,
		reason: DiscountReasonEnum.SPECIAL_DISCOUNT,
		type: DiscountTypeEnum.PERCENT,
		value: 5,
		window: WINDOW_SCHEDULED,
		buildRules: () => ({ applicable_countries: ['BG', 'HU', 'PL'] }),
		notes: null,
	},
	{
		reference: 'BF2025',
		label: 'Black Friday 2025',
		scope: DiscountScopeEnum.ORDER,
		reason: DiscountReasonEnum.FLASH_SALE,
		type: DiscountTypeEnum.PERCENT,
		value: 30,
		window: WINDOW_EXPIRED,
		buildRules: () => ({ min_order_value: 100 }),
		notes: 'Kept as an expired campaign',
	},
	{
		reference: 'SUMMER24',
		label: 'Summer Sale 2024',
		scope: DiscountScopeEnum.CATEGORY,
		reason: DiscountReasonEnum.SPECIAL_DISCOUNT,
		type: DiscountTypeEnum.AMOUNT,
		value: 15,
		window: WINDOW_EXPIRED,
		buildRules: (categoryIds) =>
			categoryIds.length > 0
				? { eligible_categories: categoryIds.slice(0, 3) }
				: undefined,
		notes: 'Kept as an expired campaign',
	},
];

const TARGET = DISCOUNTS.length;

function resolveDate(offsetInDays: number | null): Date | null {
	return offsetInDays === null
		? null
		: new Date(Date.now() + offsetInDays * DAY_IN_MILLISECONDS);
}

export const discountSeed: SeedDefinition = {
	name: 'discount',
	run: async ({ manager }): Promise<SeedSummary> => {
		// Category-scoped rows carry real ids so the rules resolve against seeded data; an
		// empty category table only costs those rows their `eligible_categories` entry.
		const categoryIds = await loadIds(manager, CategoryEntity);

		return topUp({
			entity: 'discount',
			target: TARGET,
			manager,
			entityClass: DiscountEntity,
			// `label` repeats across campaigns; the coupon code is what identifies a row
			keyColumn: 'reference',
			buildRow: (index) => {
				const blueprint = DISCOUNTS[index];
				const [startDays, endDays] = blueprint.window;

				return {
					label: blueprint.label,
					scope: blueprint.scope,
					reason: blueprint.reason,
					reference: blueprint.reference,
					type: blueprint.type,
					rules: blueprint.buildRules(categoryIds),
					value: blueprint.value,
					start_at: resolveDate(startDays),
					end_at: resolveDate(endDays),
					notes: blueprint.notes,
				};
			},
		});
	},
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(discountSeed);
}
