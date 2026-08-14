import { EventSubscriber } from 'typeorm';
import BrandContentEntity from '@/features/brand/brand-content.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class BrandContentSubscriber extends SubscriberAbstract<BrandContentEntity> {
	protected readonly Entity = BrandContentEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			beforeRemove: true,
		};
	}
}
