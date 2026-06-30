import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import OperationalRecordEntity from '@/features/cash-flow/operational-record.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class OperationalRecordQuery extends RepositoryAbstract<OperationalRecordEntity> {
	constructor(repository: Repository<OperationalRecordEntity>) {
		super(repository, OperationalRecordEntity.NAME);
	}
}

export const getOperationalRecordRepository = () =>
	dataSource.getRepository(OperationalRecordEntity).extend({
		createQuery() {
			return new OperationalRecordQuery(this);
		},
	});
