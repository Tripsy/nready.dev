import { expect, jest } from '@jest/globals';
import cron from 'node-cron';
import type { LogDataQuery } from '@/features/log-data/log-data.repository';
import { createMockQuery } from '@/tests/jest-service.setup';

/*
 * Same shape as `account-cron-jobs.test.ts`: the job resolves its repository through
 * `dataSource.getRepository(...)`, which is never initialized under `test`, so the
 * repository module is replaced before the job is imported — under the ESM preset that
 * means `unstable_mockModule` plus a dynamic import.
 */
const logDataQuery = createMockQuery() as unknown as jest.Mocked<LogDataQuery>;

jest.unstable_mockModule('@/features/log-data/log-data.repository', () => ({
	getLogDataRepository: () => ({
		createQuery: () => logDataQuery,
	}),
}));

const cleanLogData = await import(
	'@/features/log-data/cron-jobs/clean-log-data.cron'
);

const DAY_IN_SECONDS = 86400;

describe('log-data cron jobs', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('clean-log-data module contract', () => {
		it('should default-export a function', () => {
			expect(typeof cleanLogData.default).toBe('function');
		});

		it('should export a cron expression node-cron accepts', () => {
			expect(typeof cleanLogData.SCHEDULE_EXPRESSION).toBe('string');
			expect(cron.validate(cleanLogData.SCHEDULE_EXPRESSION)).toBe(true);
		});

		it('should export a numeric EXPECTED_RUN_TIME', () => {
			expect(typeof cleanLogData.EXPECTED_RUN_TIME).toBe('number');
			expect(cleanLogData.EXPECTED_RUN_TIME).toBeGreaterThan(0);
		});
	});

	describe('cleanLogData', () => {
		it('should force-delete rows created over 30 days ago', async () => {
			logDataQuery.delete.mockResolvedValue(120);

			const result = await cleanLogData.default();

			const [column, from, to] = logDataQuery.filterByRange.mock.calls[0];

			// `created_at`, not `expire_at` — `log_data` has no expiry of its own, the
			// retention window is the only thing bounding it.
			expect(column).toBe('created_at');
			expect(from).toBeUndefined();

			// Cutoff is "30 days ago"; asserted as a window so the test does not race the
			// clock between building the date and reading it back.
			const expected = Date.now() - DAY_IN_SECONDS * 30 * 1000;

			expect((to as Date).getTime()).toBeGreaterThan(expected - 5000);
			expect((to as Date).getTime()).toBeLessThan(expected + 5000);

			// (isSoftDelete: false, multiple: true, force: true) — `log_data` has no
			// `deleted_at`, so a soft delete would silently no-op and the table would keep
			// growing exactly as before.
			expect(logDataQuery.delete).toHaveBeenCalledWith(false, true, true);

			expect(result).toEqual({ removed: 120 });
		});
	});
});
