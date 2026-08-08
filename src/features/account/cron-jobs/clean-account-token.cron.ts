import { getAccountTokenRepository } from '@/features/account/account-token.repository';
import { createPastDate } from '@/helpers/date.helper';

export const SCHEDULE_EXPRESSION = '02 */3 * * *';
export const EXPECTED_RUN_TIME = 3; // seconds

// Remove expired account tokens
const cleanAccountToken = async () => {
	const countRemoved = await getAccountTokenRepository()
		.createQuery()
		.filterByRange('expire_at', undefined, createPastDate(86400))
		.delete(false, true, true);

	return {
		removed: countRemoved,
	};
};

export default cleanAccountToken;
