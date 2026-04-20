import {
	EventSubscriber,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import TemplateEntity from '@/features/template/template.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';
import { LogHistoryActionEnum } from '@/shared/types/log-history.type';

@EventSubscriber()
export class TemplateSubscriber extends SubscriberAbstract<TemplateEntity> {
	protected readonly Entity = TemplateEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
		};
	}

	beforeRemove(event: RemoveEvent<TemplateEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);
		this.cacheClean([
			event.databaseEntity.label,
			event.databaseEntity.language,
			event.databaseEntity.type,
		]);

		this.logHistory(id, LogHistoryActionEnum.REMOVED);
	}

	afterSoftRemove(event: SoftRemoveEvent<TemplateEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);
		this.cacheClean(event.databaseEntity.label);

		this.logHistory(id, LogHistoryActionEnum.DELETED);
	}

	async afterUpdate(event: UpdateEvent<TemplateEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);
		this.cacheClean(event.databaseEntity.label);

		this.logHistory(
			id,
			this.isRestore(event)
				? LogHistoryActionEnum.RESTORED
				: LogHistoryActionEnum.UPDATED,
		);
	}
}
