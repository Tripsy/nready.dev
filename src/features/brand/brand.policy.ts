import BrandEntity from '@/features/brand/brand.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class BrandPolicy extends PolicyAbstract {
	constructor() {
		const entity = BrandEntity.NAME;

		super(entity);
	}
}

export const brandPolicy = new BrandPolicy();
