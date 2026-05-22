import { EventSubscriber } from 'typeorm';
import OperationalRecordEntity from '@/features/cash-flow/operational-record.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class OperationalRecordSubscriber extends SubscriberAbstract<OperationalRecordEntity> {
	protected readonly Entity = OperationalRecordEntity;

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
