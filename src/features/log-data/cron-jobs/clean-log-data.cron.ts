import { getLogDataRepository } from '@/features/log-data/log-data.repository';
import { createPastDate } from '@/helpers/date.helper';

export const SCHEDULE_EXPRESSION = '17 04 * * 0';
export const EXPECTED_RUN_TIME = 10; // seconds

/*
 * `log_data` sits on the instance's own volume and unauthenticated traffic can cause writes
 * to it, so this job is the only thing bounding it — the other log destinations expire under
 * a retention policy their host owns, this one has nothing of the sort.
 *
 * 30 days matches the other cleanup crons. An `error` or `fatal` older than that has either
 * been dealt with or is being rediscovered from scratch anyway, and CloudWatch keeps the
 * longer tail under its own retention policy.
 *
 * Runs at :17 inside the 04:00 cleanup block, offset from its neighbours
 * (`clean-account-recovery` :02, `clean-comment-subscription` :37, `clean-cron-history` :47):
 * they share a database and a scheduler, `cron-time-check` reports jobs that start in the
 * same minute, and concurrent bulk deletes are a self-inflicted latency spike.
 */
const cleanLogData = async () => {
	const countRemoved = await getLogDataRepository()
		.createQuery()
		.filterByRange('created_at', undefined, createPastDate(86400 * 30)) // older than 30 days
		.delete(false, true, true);

	return {
		removed: countRemoved,
	};
};

export default cleanLogData;
