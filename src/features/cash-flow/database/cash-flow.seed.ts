import { Configuration } from '@/config/settings.config';
import {
	isDirectRun,
	randomInt,
	randomPick,
	type SeedDefinition,
	type SeedSummary,
	sequenceLabel,
	topUp,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import CashFlowEntity, {
	AMOUNT_DECIMALS,
	CashFlowMethodEnum,
	CashFlowStatusEnum,
	type Currency,
	CurrencyEnum,
	getExpectedCategoryType,
	getExpectedDirection,
} from '@/features/cash-flow/cash-flow.entity';
import {
	type CashFlowCategory,
	CashFlowCategoryEnum,
} from '@/features/cash-flow/cash-flow-category.enum';

const TARGET = 150;

/**
 * Only the categories `getExpectedCategoryType` actually classifies — the enum carries
 * fleet-specific values (`fuel`, `tolls`, the `employee_*` family) that this project does
 * not map, and passing one in would throw `Unknown category`.
 *
 * `refund` is classified but still absent: the table's CHECK constraint only allows
 * `category_type = 'correction'` on a row that has a `parent_id`, and this seed creates no
 * parent/child pairs.
 */
const CATEGORY_POOL: readonly CashFlowCategory[] = [
	CashFlowCategoryEnum.CUSTOMER,
	CashFlowCategoryEnum.CUSTOMER,
	CashFlowCategoryEnum.CUSTOMER,
	CashFlowCategoryEnum.CUSTOMER,
	CashFlowCategoryEnum.VENDOR,
	CashFlowCategoryEnum.VENDOR,
	CashFlowCategoryEnum.INSURANCE,
	CashFlowCategoryEnum.TAXES,
];

/** Plausible value band per seeded category, in whole currency units. */
const AMOUNT_RANGES: Partial<
	Record<CashFlowCategory, readonly [number, number]>
> = {
	[CashFlowCategoryEnum.CUSTOMER]: [80, 4500],
	[CashFlowCategoryEnum.VENDOR]: [100, 3000],
	[CashFlowCategoryEnum.INSURANCE]: [400, 3500],
	[CashFlowCategoryEnum.TAXES]: [300, 6000],
};

const VAT_RATES = [0, 5, 9, 19, 21] as const;

/** Rate against the base currency; only a foreign-currency row carries anything but 1. */
const EXCHANGE_RATES: Record<Currency, number> = {
	[CurrencyEnum.RON]: 1,
	[CurrencyEnum.EUR]: 5.08,
	[CurrencyEnum.USD]: 4.66,
};

export const cashFlowSeed: SeedDefinition = {
	name: 'cash-flow',
	run: async ({ manager, random }): Promise<SeedSummary> => {
		const baseCurrency = Configuration.currency() as Currency;

		return topUp({
			entity: 'cash-flow',
			target: TARGET,
			manager,
			entityClass: CashFlowEntity,
			// Nullable and indexed, and every seeded row fills it — so it identifies the
			// demo rows without touching anything already in the table.
			keyColumn: 'external_reference',
			buildRow: (index) => {
				const category = randomPick(random, CATEGORY_POOL);
				const categoryType = getExpectedCategoryType(category);
				const direction = getExpectedDirection(categoryType);

				if (!direction) {
					throw new Error(
						`Category "${category}" has no fixed direction and needs a parent entry`,
					);
				}

				const range = AMOUNT_RANGES[category];

				if (!range) {
					throw new Error(
						`Category "${category}" has no amount range`,
					);
				}

				const [minAmount, maxAmount] = range;

				const currency = randomPick(random, [
					baseCurrency,
					baseCurrency,
					baseCurrency,
					CurrencyEnum.EUR,
				]);

				return {
					direction,
					category_type: categoryType,
					category,
					method: randomPick(random, [
						CashFlowMethodEnum.CREDIT_CARD,
						CashFlowMethodEnum.CREDIT_CARD,
						CashFlowMethodEnum.DEBIT_CARD,
						CashFlowMethodEnum.PAYPAL,
						CashFlowMethodEnum.BANK_TRANSFER,
						CashFlowMethodEnum.CASH,
					]),
					status: randomPick(random, [
						CashFlowStatusEnum.COMPLETED,
						CashFlowStatusEnum.COMPLETED,
						CashFlowStatusEnum.COMPLETED,
						CashFlowStatusEnum.PENDING,
						CashFlowStatusEnum.AUTHORIZED,
						CashFlowStatusEnum.CANCELED,
					]),
					// Stored separator-less, scaled by 10 ** AMOUNT_DECIMALS, and the CHECK
					// constraint requires it to be strictly positive.
					amount:
						randomInt(random, minAmount, maxAmount) *
						10 ** AMOUNT_DECIMALS,
					vat_rate: randomPick(random, VAT_RATES),
					currency,
					exchange_rate:
						currency === baseCurrency
							? 1
							: EXCHANGE_RATES[currency],
					external_reference: `SEED-CF-${sequenceLabel(index, 5)}`,
					parent_id: null,
					notes: null,
				};
			},
		});
	},
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(cashFlowSeed);
}
