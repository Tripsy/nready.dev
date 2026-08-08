import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import TermEntity from '@/features/term/term.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class TermQuery extends RepositoryAbstract<TermEntity> {
	constructor(repository: Repository<TermEntity>) {
		super(repository, TermEntity.NAME);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (term.length > Configuration.get('filter.termMinLength')) {
					this.filterAny([
						{
							column: 'value',
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

export const getTermRepository = () =>
	dataSource.getRepository(TermEntity).extend({
		createQuery() {
			return new TermQuery(this);
		},
	});
