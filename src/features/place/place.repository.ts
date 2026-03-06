import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import PlaceEntity, { type PlaceTypeEnum } from '@/features/place/place.entity';
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
					this.filterAny([
						{
							column: 'content.name',
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

export const getPlaceRepository = () =>
	dataSource.getRepository(PlaceEntity).extend({
		createQuery() {
			return new PlaceQuery(this);
		},

		async checkPlaceType(
			place_id: number,
			type: PlaceTypeEnum,
		): Promise<boolean> {
			const result = await this.createQuery()
				.select(['type'])
				.filterById(place_id)
				.first();

			return result?.type === type;
		},
	});
