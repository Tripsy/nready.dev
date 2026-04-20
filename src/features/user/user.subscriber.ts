import { EventSubscriber, type InsertEvent, type UpdateEvent } from 'typeorm';
import { Configuration } from '@/config/settings.config';
import {
	type AccountService,
	accountService,
} from '@/features/account/account.service';
import UserEntity, { UserStatusEnum } from '@/features/user/user.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';
import { LogHistoryActionEnum } from '@/shared/types/log-history.type';

@EventSubscriber()
export class UserSubscriber extends SubscriberAbstract<UserEntity> {
	protected readonly Entity = UserEntity;
	private accountService: AccountService;

	constructor() {
		super();

		this.config = {
			beforeRemove: true,
			afterSoftRemove: true,
		};

		this.accountService = accountService;
	}

	async beforeInsert(event: InsertEvent<UserEntity>) {
		// Hash password before inserting a new user.
		if (event.entity.password) {
			event.entity.password = await this.accountService.encryptPassword(
				event.entity.password,
			);
		}

		// Set the default language
		if (!event.entity.language) {
			event.entity.language = Configuration.get('app.language') as string;
		}

		event.entity.password_updated_at = new Date();
	}

	async beforeUpdate(event: UpdateEvent<UserEntity>) {
		// Hash the password before updating if it has changed.
		if (event.entity?.password) {
			event.entity.password = await this.accountService.encryptPassword(
				event.entity.password,
			);
		}
	}

	async afterInsert(event: InsertEvent<UserEntity>) {
		const id = event.entity.id;

		this.logHistory(id, LogHistoryActionEnum.CREATED);

		void this.accountService.processRegistration(event.entity);
	}

	async afterUpdate(event: UpdateEvent<UserEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);

		this.logHistory(
			id,
			this.isRestore(event)
				? LogHistoryActionEnum.RESTORED
				: LogHistoryActionEnum.UPDATED,
		);

		// Check if the status was updated
		if (
			event.entity?.status &&
			event.databaseEntity?.status &&
			event.entity.status !== event.databaseEntity.status
		) {
			this.logHistory(id, LogHistoryActionEnum.STATUS, {
				oldStatus: event.databaseEntity.status,
				newStatus: event.entity.status,
			});

			if (event.entity.status === UserStatusEnum.ACTIVE) {
				this.accountService.processRegistration({
					id: id,
					name: event.entity.name || event.databaseEntity.name,
					email: event.entity.email || event.databaseEntity.email,
					language:
						event.entity.language || event.databaseEntity.language,
					status: event.entity.status,
				});
			}
		}

		// Check if the password was updated
		if (
			event.entity?.password &&
			event.databaseEntity?.password &&
			event.entity.password !== event.databaseEntity.password
		) {
			this.logHistory(id, LogHistoryActionEnum.PASSWORD_CHANGE);
		}
	}
}
