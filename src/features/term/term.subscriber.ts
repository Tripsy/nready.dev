import { EventSubscriber } from 'typeorm';
import TermEntity from '@/features/term/term.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class TermSubscriber extends SubscriberAbstract<TermEntity> {
	protected readonly Entity = TermEntity;

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
