import type { SeedDefinition } from '@/database/seed/seed.helper';
import { bootstrapSeeds } from '@/database/seed/seed.runner';
import { addressSeed } from '@/features/address/database/address.seed';
import { brandSeed } from '@/features/brand/database/brand.seed';
import { cashFlowSeed } from '@/features/cash-flow/database/cash-flow.seed';
import { categorySeed } from '@/features/category/database/category.seed';
import { clientSeed } from '@/features/client/database/client.seed';
import { placeSeed } from '@/features/place/database/place.seed';
import { userSeed } from '@/features/user/database/user.seed';
import { vendorSeed } from '@/features/vendor/database/vendor.seed';

/**
 * Declaration order is the foreign-key order and is not arbitrary: `place → address`, and
 * a seed reads the ids of its parents, so moving one earlier makes it find nothing.
 *
 * The `permission` and `template` seeds are not listed. They are reference data with
 * wipe-and-insert semantics, not demo volume, and are run on their own — as is
 * `account/database/admin.seed.ts`, which is keyed to `ADMIN_EMAIL`/`ADMIN_PASSWORD` and
 * would make `pnpm run seed` require an environment to be configured.
 */
const seeds: readonly SeedDefinition[] = [
	placeSeed,
	addressSeed,
	brandSeed,
	categorySeed,
	clientSeed,
	vendorSeed,
	userSeed,
	cashFlowSeed,
];

function resolveSeeds(
	requested: string | undefined,
): readonly SeedDefinition[] {
	if (!requested) {
		return seeds;
	}

	const match = seeds.find((seed) => seed.name === requested);

	if (!match) {
		const available = seeds.map((seed) => seed.name).join(', ');

		throw new Error(`Unknown seed "${requested}". Available: ${available}`);
	}

	return [match];
}

try {
	const selected = resolveSeeds(process.argv[2]);

	const summaries = await bootstrapSeeds(selected, 'seed.orchestrator');

	const inserted = summaries.reduce(
		(total, summary) => total + summary.inserted,
		0,
	);

	console.info(
		`Seeding finished — ${inserted} row(s) inserted across ${summaries.length} entit${summaries.length === 1 ? 'y' : 'ies'} ✅`,
	);

	process.exit(0);
} catch (error) {
	console.error('Seeding failed:', error);
	process.exit(1);
}
