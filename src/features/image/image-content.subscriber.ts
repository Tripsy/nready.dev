import { EventSubscriber } from 'typeorm';
import ImageContentEntity from '@/features/image/image-content.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class ImageContentSubscriber extends SubscriberAbstract<ImageContentEntity> {
	protected readonly Entity = ImageContentEntity;

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
