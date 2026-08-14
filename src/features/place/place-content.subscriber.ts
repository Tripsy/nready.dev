import { EventSubscriber } from 'typeorm';
import PlaceContentEntity from '@/features/place/place-content.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class PlaceContentSubscriber extends SubscriberAbstract<PlaceContentEntity> {
	protected readonly Entity = PlaceContentEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			beforeRemove: true,
		};
	}
}
