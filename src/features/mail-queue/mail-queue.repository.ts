import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class MailQueueQuery extends RepositoryAbstract<MailQueueEntity> {
	constructor(repository: Repository<MailQueueEntity>) {
		super(repository, MailQueueEntity.NAME);
	}
}

export const getMailQueueRepository = () =>
	dataSource.getRepository(MailQueueEntity).extend({
		createQuery() {
			return new MailQueueQuery(this);
		},
	});
