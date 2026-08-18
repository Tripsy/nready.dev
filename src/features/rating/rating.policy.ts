import RatingEntity from '@/features/rating/rating.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

/**
 * Dashboard authorization only. The public endpoints are open by design — a rating is cast by
 * whoever is reading, signed in or not — and are gated by the caller's own identity instead
 * (`RatingQuery.filterByOwner`) rather than by a permission.
 */
export class RatingPolicy extends PolicyAbstract {
	constructor() {
		const entity = RatingEntity.NAME;

		super(entity);
	}
}

export const ratingPolicy = new RatingPolicy();
