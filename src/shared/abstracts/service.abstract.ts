import { eventEmitter } from '@/config/event.config';
import { lang } from '@/config/message.setup';
import { BadRequestError, CustomError } from '@/exceptions';
import type { StatusTransitions } from '@/shared/types/common.type';

type EntityWithCache = {
	NAME: string;
	HAS_CACHE: boolean;
};

/**
 * Drops an entity's cached entries — the service-side counterpart of
 * `SubscriberAbstract.cacheClean`.
 *
 * **Call this from the service, after the transaction commits, for any write that touches an
 * entity's child rows** (translations, link tables, a settings row). A subscriber cannot do
 * that job here for two reasons:
 *
 * 1. *It fires per row.* Saving three translations broadcast three identical cleans, each a
 *    full Redis SCAN over the same keyspace, all but the first finding nothing. The service
 *    knows the write was one operation on one article; the row-level hook cannot.
 * 2. *It fires inside the transaction.* A concurrent reader can slip between the subscriber's
 *    DELETE and the COMMIT, refill the cache from a snapshot that is about to be superseded,
 *    and leave it stale with no further write coming to correct it. Emitting after commit
 *    closes that window; no amount of deduplication downstream can.
 *
 * Subscribers keep invalidating the entity's *own* row writes (`delete`, `restore`, a plain
 * status change), which is why parent-row saves are not repeated here.
 *
 *
 * @param {EntityWithCache} entity - Entity class whose `NAME` prefixes the cache keys
 * @param {number} id - Row whose keys should be dropped
 */
export function cleanEntityCache(entity: EntityWithCache, id: number): void {
	if (!entity.HAS_CACHE) {
		return;
	}

	eventEmitter.emit('cacheClean', {
		cacheKeyArgs: [entity.NAME, id.toString()],
	});
}

export function assertValidStatusTransition<S extends string>(
	statusTransitions: StatusTransitions<S>,
	currentStatus: S,
	newStatus: S,
) {
	if (currentStatus === newStatus) {
		throw new BadRequestError(
			lang('shared.error.status_unchanged', { status: newStatus }),
		);
	}

	const allowed = statusTransitions[currentStatus] || [];

	if (!allowed.includes(newStatus)) {
		throw new CustomError(
			409,
			lang('shared.error.status_update_not_allowed', {
				currentStatus: currentStatus,
				newStatus: newStatus,
			}),
		);
	}
}
