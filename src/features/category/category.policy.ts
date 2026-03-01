import CategoryEntity from '@/features/category/category.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class CategoryPolicy extends PolicyAbstract {
	constructor() {
		const entity = CategoryEntity.NAME;

		super(entity);
	}
}

export const categoryPolicy = new CategoryPolicy();
