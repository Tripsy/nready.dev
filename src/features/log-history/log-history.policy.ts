import LogHistoryEntity from '@/features/log-history/log-history.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class LogHistoryPolicy extends PolicyAbstract {
	constructor() {
		const entity = LogHistoryEntity.NAME;

		super(entity);
	}
}

export const logHistoryPolicy = new LogHistoryPolicy();
