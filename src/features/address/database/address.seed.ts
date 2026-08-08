import {
	isDirectRun,
	randomPick,
	type SeedDefinition,
	type SeedSummary,
	sequenceLabel,
	topUp,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import AddressEntity from '@/features/address/address.entity';
import PlaceEntity, { PlaceTypeEnum } from '@/features/place/place.entity';

const TARGET = 60;

const STREET_NAMES = [
	'Strada Victoriei',
	'Bulevardul Unirii',
	'Strada Republicii',
	'Calea Dorobantilor',
	'Strada Garii',
	'Bulevardul Decebal',
	'Strada Depozitelor',
	'Calea Industriilor',
	'Strada Logisticii',
	'Bulevardul Transportatorilor',
] as const;

export const addressSeed: SeedDefinition = {
	name: 'address',
	run: async ({ manager, random }): Promise<SeedSummary> => {
		// Any city will do as a parent; the seed only needs the reference to be valid.
		const cities = await manager.getRepository(PlaceEntity).find({
			select: { id: true },
			where: { place_type: PlaceTypeEnum.CITY },
			order: { id: 'ASC' },
		});

		if (cities.length === 0) {
			throw new Error(
				'No city places found — run the place seed before the address seed',
			);
		}

		const cityIds = cities.map((city) => city.id);

		return topUp({
			entity: 'address',
			target: TARGET,
			manager,
			entityClass: AddressEntity,
			// `address` carries no unique column, so the street line doubles as the natural
			// key — the house number is derived from the index, which keeps it distinct.
			keyColumn: 'details',
			buildRow: (index) => ({
				city_id: randomPick(random, cityIds),
				details: `${randomPick(random, STREET_NAMES)} ${100 + index}`,
				postal_code: `${randomPick(random, ['01', '02', '03', '04', '05'])}${sequenceLabel(index, 4)}`,
			}),
		});
	},
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(addressSeed);
}
