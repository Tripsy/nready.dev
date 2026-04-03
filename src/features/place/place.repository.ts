import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import PlaceEntity from '@/features/place/place.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class PlaceQuery extends RepositoryAbstract<PlaceEntity> {
	constructor(repository: Repository<PlaceEntity>) {
		super(repository, PlaceEntity.NAME);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('place.id', Number(term));
			} else {
				if (
					term.length >
					(Configuration.get('filter.termMinLength') as number)
				) {
					this.filterRaw(
						`to_tsvector('simple', COALESCE(content.name, '')) @@ plainto_tsquery('simple', :term)`,
						{ term: term },
					);
				}
			}
		}

		return this;
	}
}

export const getPlaceRepository = () =>
	dataSource.getRepository(PlaceEntity).extend({
		createQuery() {
			return new PlaceQuery(this);
		},
	});
