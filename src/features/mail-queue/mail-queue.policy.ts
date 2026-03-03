import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class MailQueuePolicy extends PolicyAbstract {
	constructor() {
		const entity = MailQueueEntity.NAME;

		super(entity);
	}
}

export const mailQueuePolicy = new MailQueuePolicy();
