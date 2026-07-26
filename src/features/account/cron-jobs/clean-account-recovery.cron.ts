import { getAccountRecoveryRepository } from '@/features/account/account-recovery.repository';
import { createPastDate } from '@/helpers/date.helper';

export const SCHEDULE_EXPRESSION = '02 04 */7 * *';
export const EXPECTED_RUN_TIME = 3; // seconds

// Remove expired recovery tokens
const cleanAccountRecovery = async () => {
	const countRemoved = await getAccountRecoveryRepository()
		.createQuery()
		.filterByRange('expire_at', undefined, createPastDate(86400 * 30)) // older than 30 days
		.delete(false, true, true);

	return {
		removed: countRemoved,
	};
};

export default cleanAccountRecovery;
