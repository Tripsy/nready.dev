import { EventSubscriber } from 'typeorm';
import VendorEntity from '@/features/vendor/vendor.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class VendorSubscriber extends SubscriberAbstract<VendorEntity> {
	protected readonly Entity = VendorEntity;

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
