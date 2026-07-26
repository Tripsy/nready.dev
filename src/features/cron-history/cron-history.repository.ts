import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import CronHistoryEntity from '@/features/cron-history/cron-history.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class CronHistoryQuery extends RepositoryAbstract<CronHistoryEntity> {
	constructor(repository: Repository<CronHistoryEntity>) {
		super(repository, CronHistoryEntity.NAME);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (term.length > Configuration.get('filter.termMinLength')) {
					this.filterAny([
						{
							column: 'label',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'content::text',
							value: term,
							operator: 'ILIKE',
						},
					]);
				}
			}
		}

		return this;
	}
}

export const getCronHistoryRepository = () =>
	dataSource.getRepository(CronHistoryEntity).extend({
		createQuery() {
			return new CronHistoryQuery(this);
		},
	});
