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
} from '@/features/vendor/vendor.entity';

const TARGET = 15;

/** Service categories a haulier actually buys from, paired into a readable trade name. */
const VENDOR_TRADES = [
	'Fuel',
	'Tyre',
	'Service',
	'Parts',
	'Wash',
	'Insurance',
	'Toll',
	'Logistics',
	'Freight',
	'Customs',
	'Fleet',
	'Telematics',
	'Trailer',
	'Cargo',
	'Roadside',
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
			buildRow: (index) => ({
				name: `${VENDOR_TRADES[index % VENDOR_TRADES.length]} ${randomPick(random, VENDOR_SUFFIXES)} ${index + 1}`,
				status: randomPick(random, [
					VendorStatusEnum.ACTIVE,
					VendorStatusEnum.ACTIVE,
					VendorStatusEnum.ACTIVE,
					VendorStatusEnum.INACTIVE,
					VendorStatusEnum.PENDING,
				]),
			}),
		}),
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(vendorSeed);
}
