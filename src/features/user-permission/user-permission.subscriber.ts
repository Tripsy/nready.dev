import {
	EventSubscriber,
	type InsertEvent,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import UserEntity from '@/features/user/user.entity';
import UserPermissionEntity from '@/features/user-permission/user-permission.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';
import { LogHistoryActionEnum } from '@/shared/types/log-history.type';

@EventSubscriber()
export class UserPermissionSubscriber extends SubscriberAbstract<UserPermissionEntity> {
	protected readonly Entity = UserPermissionEntity;

	beforeRemove(event: RemoveEvent<UserPermissionEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;
		const user_id: number =
			event.entity?.user_id || event.databaseEntity?.user_id;

		this.cacheClean(user_id, UserEntity);

		this.logHistory(id, LogHistoryActionEnum.DELETED);
	}

	afterSoftRemove(event: SoftRemoveEvent<UserPermissionEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;
		const user_id: number =
			event.entity?.user_id || event.databaseEntity?.user_id;

		this.cacheClean(user_id, UserEntity);
		this.logHistory(id, LogHistoryActionEnum.REMOVED);
	}

	afterInsert(event: InsertEvent<UserPermissionEntity>) {
		const id = event.entity?.id;
		const user_id = event.entity?.user_id;

		this.cacheClean(user_id, UserEntity);
		this.logHistory(id, LogHistoryActionEnum.CREATED);
	}

	afterUpdate(event: UpdateEvent<UserPermissionEntity>) {
		if (this.isRestore(event)) {
			const id: number = event.entity?.id || event.databaseEntity.id;
			const user_id: number =
				event.entity?.user_id || event.databaseEntity?.user_id;

			this.cacheClean(user_id, UserEntity);
			this.logHistory(id, LogHistoryActionEnum.RESTORED);
		}
	}
}
