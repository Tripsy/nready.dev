import { EventSubscriber } from 'typeorm';
import CategoryContentEntity from '@/features/category/category-content.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class CategoryContentSubscriber extends SubscriberAbstract<CategoryContentEntity> {
	protected readonly Entity = CategoryContentEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			beforeRemove: true,
		};
	}
}
