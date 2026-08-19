import { EventEmitter } from 'node:events';
import type UserEntity from '@/features/user/user.entity';
import type { UserStatus } from '@/features/user/user.entity';
import type { LogHistoryAction } from '@/shared/types/log-history.type';

export type LogHistoryEventPayload = {
	entity: string;
	entity_ids: number[];
	action: LogHistoryAction;
	data?: Record<string, string | number>;
};

export type CacheCleanEventPayload = {
	cacheKeyArgs: string[];
};

/**
 * Rows that have just left the database for good, named the way a polymorphic target is: the table
 * they lived in and their ids.
 *
 * Everything pointing at them without a foreign key — `rating` today, anything added later —
 * cleans up from this rather than being deleted by the feature that owned the rows, which knows
 * nothing about the tables referencing it.
 *
 * `entity_type` is the table name (`CommentEntity.NAME`), which is exactly what a polymorphic
 * column stores, so a listener can match it against its own enum without either side importing
 * the other.
 *
 * Emitted for a **hard** delete only. A soft-deleted row still exists and can be restored, so
 * what points at it stays valid — an article leaving through `deleted_at` keeps its ratings.
 */
export type EntityRemovedEventPayload = {
	entity_type: string;
	entity_ids: number[];
};

export type UserRegisteredEventPayload = Partial<UserEntity> & {
	id: number;
	name: string;
	email: string;
	language: string;
	status: UserStatus;
};

type Events = {
	history: LogHistoryEventPayload;
	cacheClean: CacheCleanEventPayload;
	entityRemoved: EntityRemovedEventPayload;
	userRegistered: UserRegisteredEventPayload;
};

class TypedEmitter extends EventEmitter {
	on<K extends keyof Events>(
		event: K,
		listener: (payload: Events[K]) => void,
	) {
		return super.on(event, listener);
	}

	emit<K extends keyof Events>(event: K, payload: Events[K]) {
		return super.emit(event, payload);
	}
}

export const eventEmitter = new TypedEmitter();
