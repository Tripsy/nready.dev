import type { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Configuration } from '@/config/settings.config';
import AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import {
	type AccountRecoveryQuery,
	getAccountRecoveryRepository,
} from '@/features/account/account-recovery.repository';
import type UserEntity from '@/features/user/user.entity';
import { createCurrentDate, createFutureDate } from '@/helpers/date.helper';
import type { TokenMetadata } from '@/helpers/meta-data.helper';

export class AccountRecoveryService {
	constructor(
		private accountRecoveryRepository: Repository<AccountRecoveryEntity> & {
			createQuery(): AccountRecoveryQuery;
		},
	) {}

	/**
	 * @description Marks a recovery token as redeemed
	 *
	 * Deliberately `repository.update` rather than `save`: `save` resolves a partial by
	 * primary key and falls back to an INSERT when no such row exists, which is how a
	 * successful recovery once ended as a not-null violation on `user_id`. `update` issues
	 * a plain `UPDATE ... WHERE id = ?` and is a no-op when the row is gone.
	 */
	public async markAsUsed(id: number): Promise<void> {
		await this.accountRecoveryRepository.update(id, {
			used_at: createCurrentDate(),
		});
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
	 * @description Removes the recovery tokens of a user
	 *
	 * `exceptId` keeps a single row alive — the one being redeemed, so a second click on
	 * the same link can still be told it was already used instead of falling through to a
	 * bare "not authorized". The cron in `clean-account-recovery.cron.ts` prunes it once it
	 * is 30 days past expiry.
	 */
	public async removeAccountRecoveryForUser(
		user_id: number,
		exceptId?: number,
	): Promise<void> {
		const query = this.accountRecoveryRepository
			.createQuery()
			.filterBy('user_id', user_id);

		if (exceptId) {
			query.filterBy('id', exceptId, '!=');
		}

		await query.delete(false, true);
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
