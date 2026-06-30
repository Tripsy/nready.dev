import { EventSubscriber } from 'typeorm';
import AddressEntity from '@/features/address/address.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class AddressSubscriber extends SubscriberAbstract<AddressEntity> {
	protected readonly Entity = AddressEntity;

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
