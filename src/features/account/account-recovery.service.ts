import type { DeepPartial, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Configuration } from '@/config/settings.config';
import AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import {
	type AccountRecoveryQuery,
	getAccountRecoveryRepository,
} from '@/features/account/account-recovery.repository';
import type UserEntity from '@/features/user/user.entity';
import { createFutureDate } from '@/helpers/date.helper';
import type { TokenMetadata } from '@/helpers/meta-data.helper';

export class AccountRecoveryService {
	constructor(
		private accountRecoveryRepository: Repository<AccountRecoveryEntity> & {
			createQuery(): AccountRecoveryQuery;
		},
	) {}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<AccountRecoveryEntity> & { id: number },
	): Promise<AccountRecoveryEntity> {
		return this.accountRecoveryRepository.save(data);
	}

	/**
	 * @description Creates a new recovery token via repository
	 */
	public async setupRecovery(
		user: Partial<UserEntity> & { id: number },
		metadata: TokenMetadata,
	): Promise<[string, Date]> {
		const ident: string = uuid();
		const expire_at = createFutureDate(
			Configuration.get('user.recoveryIdentExpiresIn'),
		);

		const accountRecoveryEntity = new AccountRecoveryEntity();
		accountRecoveryEntity.user_id = user.id;
		accountRecoveryEntity.ident = ident;
		accountRecoveryEntity.metadata = metadata;
		accountRecoveryEntity.expire_at = expire_at;

		await this.accountRecoveryRepository.save(accountRecoveryEntity);

		return [ident, expire_at];
	}

	/**
	 * @description Removes all recovery tokens for a user
	 */
	public async removeAccountRecoveryForUser(user_id: number): Promise<void> {
		await this.accountRecoveryRepository
			.createQuery()
			.filterBy('user_id', user_id)
			.delete(false, true);
	}

	public async countRecoveryAttempts(user_id: number, sinceDate: Date) {
		return this.accountRecoveryRepository
			.createQuery()
			.filterBy('user_id', user_id)
			.filterByRange('created_at', sinceDate)
			.count();
	}

	public async findByIdent(
		ident: string,
		fields = ['id', 'user_id', 'metadata', 'used_at', 'expire_at'],
	) {
		return this.accountRecoveryRepository
			.createQuery()
			.select(fields)
			.filterByIdent(ident)
			.first();
	}
}

export const accountRecoveryService = new AccountRecoveryService(
	getAccountRecoveryRepository(),
);
