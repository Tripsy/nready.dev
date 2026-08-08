import {
	isDirectRun,
	randomPick,
	type SeedDefinition,
	type SeedSummary,
	sequenceLabel,
	topUp,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import UserEntity, {
	UserOperatorTypeEnum,
	UserStatusEnum,
} from '@/features/user/user.entity';
import { UserRoleEnum } from '@/shared/types/user-role.type';

const TARGET = 12;

/**
 * Demo credentials, stored here in plaintext deliberately: `UserSubscriber.beforeInsert`
 * hashes `password` on the way in, so a pre-hashed value would be hashed a second time and
 * no login would ever match it. The same hook fills `password_updated_at`, which is why no
 * row below sets it.
 *
 * Fine to hold in the repository because these accounts only ever exist in a seeded
 * development database — never point this seed at anything else.
 */
const ADMIN_EMAIL = 'admin@demo.test';
const ADMIN_PASSWORD = 'Admin123!';
const DEFAULT_PASSWORD = 'Test123!';

const FIRST_NAMES = [
	'Andrei',
	'Maria',
	'Ionut',
	'Elena',
	'Radu',
	'Cristina',
	'Mihai',
	'Ana',
	'Vlad',
	'Diana',
	'Sorin',
] as const;

const LAST_NAMES = [
	'Popescu',
	'Ionescu',
	'Dumitrescu',
	'Stanciu',
	'Marin',
	'Gheorghe',
	'Voicu',
	'Barbu',
] as const;

export const userSeed: SeedDefinition = {
	name: 'user',
	run: async ({ manager, random }): Promise<SeedSummary> =>
		topUp({
			entity: 'user',
			target: TARGET,
			manager,
			entityClass: UserEntity,
			keyColumn: 'email',
			buildRow: (index) => {
				const now = new Date();

				// Index 0 is always the admin, so a fresh database is never left without a
				// way in — the rest of the demo data is unusable without one.
				if (index === 0) {
					return {
						name: 'Demo Admin',
						email: ADMIN_EMAIL,
						email_verified_at: now,
						password: ADMIN_PASSWORD,
						language: 'en',
						status: UserStatusEnum.ACTIVE,
						role: UserRoleEnum.ADMIN,
						operator_type: null,
					};
				}

				// Roughly a third staff operators, the rest ordinary members — the shape of
				// a storefront's account table.
				const isOperator = index % 3 === 0;

				const name = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[index % LAST_NAMES.length]}`;

				return {
					name,
					email: `${isOperator ? 'operator' : 'member'}-${sequenceLabel(index)}@demo.test`,
					email_verified_at: now,
					password: DEFAULT_PASSWORD,
					language: 'en',
					status: randomPick(random, [
						UserStatusEnum.ACTIVE,
						UserStatusEnum.ACTIVE,
						UserStatusEnum.ACTIVE,
						UserStatusEnum.INACTIVE,
						UserStatusEnum.PENDING,
					]),
					role: isOperator
						? UserRoleEnum.OPERATOR
						: UserRoleEnum.MEMBER,
					operator_type: isOperator
						? randomPick(random, [
								UserOperatorTypeEnum.SELLER,
								UserOperatorTypeEnum.PRODUCT_MANAGER,
								UserOperatorTypeEnum.CONTENT_EDITOR,
							])
						: null,
				};
			},
		}),
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(userSeed);
}
