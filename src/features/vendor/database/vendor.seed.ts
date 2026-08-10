import {
	isDirectRun,
	randomPick,
	type SeedDefinition,
	type SeedSummary,
	topUp,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import VendorEntity, {
	VendorStatusEnum,
	type VendorType,
	VendorTypeEnum,
} from '@/features/vendor/vendor.entity';

const TARGET = 15;

/**
 * Trades a haulier actually buys from, paired into a readable trade name. The trade carries the
 * vendor type with it — what is bought is what decides it, and hard-coding the pair keeps the row
 * a pure function of the index, which `topUp` requires.
 */
const VENDOR_TRADES: ReadonlyArray<readonly [string, VendorType]> = [
	['Fuel', VendorTypeEnum.SUPPLIER],
	['Tyre', VendorTypeEnum.SUPPLIER],
	['Service', VendorTypeEnum.PROVIDER],
	['Parts', VendorTypeEnum.SUPPLIER],
	['Wash', VendorTypeEnum.PROVIDER],
	['Insurance', VendorTypeEnum.PROVIDER],
	['Toll', VendorTypeEnum.PROVIDER],
	['Logistics', VendorTypeEnum.PROVIDER],
	['Freight', VendorTypeEnum.PROVIDER],
	['Customs', VendorTypeEnum.PROVIDER],
	['Fleet', VendorTypeEnum.PROVIDER],
	['Telematics', VendorTypeEnum.PROVIDER],
	['Trailer', VendorTypeEnum.SUPPLIER],
	['Cargo', VendorTypeEnum.SUPPLIER],
	['Roadside', VendorTypeEnum.PROVIDER],
] as const;

const VENDOR_SUFFIXES = ['SRL', 'SA', 'Group', 'Partners', 'Services'] as const;

export const vendorSeed: SeedDefinition = {
	name: 'vendor',
	run: async ({ manager, random }): Promise<SeedSummary> =>
		topUp({
			entity: 'vendor',
			target: TARGET,
			manager,
			entityClass: VendorEntity,
			keyColumn: 'name',
			buildRow: (index) => {
				const [trade, type] =
					VENDOR_TRADES[index % VENDOR_TRADES.length];

				return {
					name: `${trade} ${randomPick(random, VENDOR_SUFFIXES)} ${index + 1}`,
					type,
					status: randomPick(random, [
						VendorStatusEnum.ACTIVE,
						VendorStatusEnum.ACTIVE,
						VendorStatusEnum.ACTIVE,
						VendorStatusEnum.INACTIVE,
						VendorStatusEnum.PENDING,
					]),
				};
			},
		}),
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(vendorSeed);
}
