import { EventSubscriber } from 'typeorm';
import TermContentEntity from '@/features/term/term-content.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class TermContentSubscriber extends SubscriberAbstract<TermContentEntity> {
	protected readonly Entity = TermContentEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			beforeRemove: true,
		};
	}
}
