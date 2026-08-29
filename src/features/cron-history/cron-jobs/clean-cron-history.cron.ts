import { getCronHistoryRepository } from '@/features/cron-history/cron-history.repository';
import { createPastDate } from '@/helpers/date.helper';

export const SCHEDULE_EXPRESSION = '47 04 * * 0';
export const EXPECTED_RUN_TIME = 10; // seconds

const RETENTION_DAYS = 90;

/*
 * `cron_history` gains a row per job per run and never loses one, so it grows with the
 * number of scheduled jobs times their frequency — the hourly jobs alone outpace every
 * other table this project cleans up.
 *
 * 90 days is longer than the 30 the other cleanup crons keep, because this table is what
 * `cron-error-count` and `cron-warning-count` report from: a schedule that only misbehaves
 * monthly needs a few occurrences on record before the pattern is visible.
 *
 * Filters on `start_at` — the entity has no `created_at`, and no `deleted_at` either, so
 * the delete is a hard one.
 *
 * `delete` loads the matching rows and removes them one by one inside a transaction, so
 * the cost scales with the backlog rather than the retention window. Steady state is a
 * week of rows; the first run after this job is deployed clears everything already past
 * 90 days, which is why the expected run time is generous.
 *
 * Runs Sundays at 04:47, alongside the other weekly cleanups. Day-of-week is what gives
 * a true seven-day gap — a `day-of-month` step restarts each month, leaving an interval
 * of two days in February and three in a 31-day month. The minute is offset from the
 * rest of the 04:00 block (`clean-account-recovery` :02, `clean-log-data` :17,
 * `clean-comment-subscription` :37) because `cron-time-check` reports jobs starting in
 * the same minute, and concurrent bulk deletes share one database.
 */
const cleanCronHistory = async () => {
	const countRemoved = await getCronHistoryRepository()
		.createQuery()
		.filterByRange(
			'start_at',
			undefined,
			createPastDate(86400 * RETENTION_DAYS),
		)
		.delete(false, true, true);

	return {
		removed: countRemoved,
	};
};

export default cleanCronHistory;
