import { EventSubscriber } from 'typeorm';
import DocumentSeriesEntity from '@/features/document-series/document-series.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class DocumentSeriesSubscriber extends SubscriberAbstract<DocumentSeriesEntity> {
	protected readonly Entity = DocumentSeriesEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			beforeRemove: true,
		};
	}
}
