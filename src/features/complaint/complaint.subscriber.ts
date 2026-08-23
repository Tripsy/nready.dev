import { EventSubscriber, type UpdateEvent } from 'typeorm';
import ComplaintEntity from '@/features/complaint/complaint.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';
import { LogHistoryActionEnum } from '@/shared/types/log-history.type';

/**
 * A complaint accuses somebody, and what the dashboard does with it — resolve, reopen, dismiss,
 * restore — is exactly the trail a disputed moderation decision is answered from. That is what
 * `log_history` keeps, and it is the only reason this table is subscribed to at all: `HAS_CACHE`
 * is false, so there is no cache behind it either way.
 *
 * `beforeRemove` is not configured: nothing hard-deletes a complaint through the repository, and
 * the `ON DELETE CASCADE` that follows a deleted user runs inside Postgres, where no TypeORM
 * subscriber is listening.
 */
@EventSubscriber()
export class ComplaintSubscriber extends SubscriberAbstract<ComplaintEntity> {
	protected readonly Entity = ComplaintEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			afterSoftRemove: true,
		};
	}

	/**
	 * The moderation decision, logged as a status move on top of the plain `updated` entry the
	 * base class writes.
	 *
	 * `SubscriberAbstract` looks for a `status` column to do this, and a complaint has none — its
	 * state is the `is_resolved` flag — so the transition it exists to record would otherwise go
	 * down as an ordinary update, indistinguishable from an amended description.
	 */
	afterUpdate(event: UpdateEvent<ComplaintEntity>) {
		super.afterUpdate(event);

		if (!event.entity || !event.databaseEntity) {
			return;
		}

		const wasResolved = event.databaseEntity.is_resolved;
		const isResolved = event.entity.is_resolved;

		if (isResolved === undefined || wasResolved === isResolved) {
			return;
		}

		this.logHistory(event.databaseEntity.id, LogHistoryActionEnum.STATUS, {
			oldStatus: wasResolved ? 'resolved' : 'open',
			newStatus: isResolved ? 'resolved' : 'open',
		});
	}
}
