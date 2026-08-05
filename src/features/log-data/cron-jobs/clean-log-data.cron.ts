import { getLogDataRepository } from '@/features/log-data/log-data.repository';
import { createPastDate } from '@/helpers/date.helper';

export const SCHEDULE_EXPRESSION = '17 04 */7 * *';
export const EXPECTED_RUN_TIME = 10; // seconds

/*
 * `log_data` had no retention at all: it only ever grew, on the instance's own volume,
 * with nothing to bound it. Everything else that accumulates already has a cleanup pass
 * (`clean-account-recovery`, `clean-account-token`, `clean-mail-queue`) — this closes the
 * gap for the one table that unauthenticated traffic can cause writes to.
 *
 * 30 days matches the other cleanup crons. An `error` or `fatal` older than that has either
 * been dealt with or is being rediscovered from scratch anyway, and CloudWatch keeps the
 * longer tail under its own retention policy.
 *
 * Runs at :17 rather than on the hour, offset from the other weekly jobs — they share a
 * database and a scheduler, and three simultaneous bulk deletes is a self-inflicted
 * latency spike.
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
