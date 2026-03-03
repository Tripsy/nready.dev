import { EventSubscriber } from 'typeorm';
import CategoryEntity from '@/features/category/category.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class CategorySubscriber extends SubscriberAbstract<CategoryEntity> {
	protected readonly Entity = CategoryEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			beforeRemove: true,
			afterSoftRemove: true,
		};
	}
}
