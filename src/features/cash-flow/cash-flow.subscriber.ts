import { EventSubscriber } from 'typeorm';
import CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class CashFlowSubscriber extends SubscriberAbstract<CashFlowEntity> {
	protected readonly Entity = CashFlowEntity;

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
