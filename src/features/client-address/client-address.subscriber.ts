import { EventSubscriber } from 'typeorm';
import ClientAddressEntity from '@/features/client-address/client-address.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class ClientAddressSubscriber extends SubscriberAbstract<ClientAddressEntity> {
	protected readonly Entity = ClientAddressEntity;

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
