import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import ImageEntity from '@/features/image/image.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ImageQuery extends RepositoryAbstract<ImageEntity> {
	constructor(repository: Repository<ImageEntity>) {
		super(repository, ImageEntity.NAME);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('image.id', Number(term));
			} else {
				if (
					term.length >
					(Configuration.get('filter.termMinLength') as number)
				) {
					this.filterAny([
						{
							column: 'image.name',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'content.description',
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

export const getImageRepository = () =>
	dataSource.getRepository(ImageEntity).extend({
		createQuery() {
			return new ImageQuery(this);
		},
	});
