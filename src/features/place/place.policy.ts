import PlaceEntity from '@/features/place/place.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class PlacePolicy extends PolicyAbstract {
	constructor() {
		const entity = PlaceEntity.NAME;

		super(entity);
	}
}

export const placePolicy = new PlacePolicy();
