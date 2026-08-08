import { expect, jest } from '@jest/globals';
import cron from 'node-cron';
import type { AccountRecoveryQuery } from '@/features/account/account-recovery.repository';
import type { AccountTokenQuery } from '@/features/account/account-token.repository';
import { createMockQuery } from '@/tests/jest-service.setup';

/*
 * The cron jobs resolve their repository through `dataSource.getRepository(...)`, which is
 * never initialized under `test`. Both repository modules are therefore replaced before the
 * jobs are imported — under the ESM preset that means `unstable_mockModule` plus a dynamic
 * import, the same shape as `account-email.service.test.ts`.
 */
// Type-only imports above are erased at runtime, so they do not resurrect the mocked
// modules; they just give the mocks their real signatures.
const accountRecoveryQuery =
	createMockQuery() as unknown as jest.Mocked<AccountRecoveryQuery>;
const accountTokenQuery =
	createMockQuery() as unknown as jest.Mocked<AccountTokenQuery>;

jest.unstable_mockModule(
	'@/features/account/account-recovery.repository',
	() => ({
		getAccountRecoveryRepository: () => ({
			createQuery: () => accountRecoveryQuery,
		}),
	}),
);

jest.unstable_mockModule('@/features/account/account-token.repository', () => ({
	getAccountTokenRepository: () => ({
		createQuery: () => accountTokenQuery,
	}),
}));

const cleanAccountRecovery = await import(
	'@/features/account/cron-jobs/clean-account-recovery.cron'
);
const cleanAccountToken = await import(
	'@/features/account/cron-jobs/clean-account-token.cron'
);

const DAY_IN_SECONDS = 86400;

describe('account cron jobs', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	/*
	 * `cron.provider.ts` refuses to register a job whose default export is not a function,
	 * whose SCHEDULE_EXPRESSION is not a valid cron string, or whose EXPECTED_RUN_TIME is
	 * not a number — and it throws while doing it. A typo in any of these is a boot
	 * failure, so the contract is asserted here rather than discovered on deploy.
	 */
	describe.each([
		['clean-account-recovery', cleanAccountRecovery],
		['clean-account-token', cleanAccountToken],
	])('%s module contract', (_name, module) => {
		it('should default-export a function', () => {
			expect(typeof module.default).toBe('function');
		});

		it('should export a cron expression node-cron accepts', () => {
			expect(typeof module.SCHEDULE_EXPRESSION).toBe('string');
			expect(cron.validate(module.SCHEDULE_EXPRESSION)).toBe(true);
		});

		it('should export a numeric EXPECTED_RUN_TIME', () => {
			expect(typeof module.EXPECTED_RUN_TIME).toBe('number');
			expect(module.EXPECTED_RUN_TIME).toBeGreaterThan(0);
		});
	});

	describe('cleanAccountRecovery', () => {
		it('should force-delete rows that expired over 30 days ago', async () => {
			accountRecoveryQuery.delete.mockResolvedValue(4);

			const result = await cleanAccountRecovery.default();

			const [column, from, to] =
				accountRecoveryQuery.filterByRange.mock.calls[0];

			expect(column).toBe('expire_at');
			expect(from).toBeUndefined();

			// Cutoff is "30 days ago"; asserted as a window so the test does not race the
			// clock between building the date and reading it back.
			const expected = Date.now() - DAY_IN_SECONDS * 30 * 1000;

			expect((to as Date).getTime()).toBeGreaterThan(expected - 5000);
			expect((to as Date).getTime()).toBeLessThan(expected + 5000);

			// (isSoftDelete: false, multiple: true, force: true) — a bulk hard delete with
			// the repository's "no filter" guard bypassed, so the arguments matter.
			expect(accountRecoveryQuery.delete).toHaveBeenCalledWith(
				false,
				true,
				true,
			);

			expect(result).toEqual({ removed: 4 });
		});
	});

	describe('cleanAccountToken', () => {
		it('should force-delete tokens that expired over a day ago', async () => {
			accountTokenQuery.delete.mockResolvedValue(9);

			const result = await cleanAccountToken.default();

			const [column, from, to] =
				accountTokenQuery.filterByRange.mock.calls[0];

			expect(column).toBe('expire_at');
			expect(from).toBeUndefined();

			const expected = Date.now() - DAY_IN_SECONDS * 1000;

			expect((to as Date).getTime()).toBeGreaterThan(expected - 5000);
			expect((to as Date).getTime()).toBeLessThan(expected + 5000);

			expect(accountTokenQuery.delete).toHaveBeenCalledWith(
				false,
				true,
				true,
			);

			expect(result).toEqual({ removed: 9 });
		});
	});
});
