import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import CategoryEntity from '@/features/category/category.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class CategoryQuery extends RepositoryAbstract<CategoryEntity> {
	constructor(repository: Repository<CategoryEntity>) {
		super(repository, CategoryEntity.NAME);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (term.length >= Configuration.get('filter.termMinLength')) {
					this.filterAny([
						{
							column: 'content.label',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'parentContent.label',
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

export const getCategoryRepository = () =>
	dataSource.getRepository(CategoryEntity).extend({
		createQuery() {
			return new CategoryQuery(this);
		},
	});
