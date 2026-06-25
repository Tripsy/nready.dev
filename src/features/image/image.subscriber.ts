import { EventSubscriber } from 'typeorm';
import ImageEntity from '@/features/image/image.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class ImageSubscriber extends SubscriberAbstract<ImageEntity> {
	protected readonly Entity = ImageEntity;

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
