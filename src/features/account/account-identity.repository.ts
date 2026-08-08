import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import AccountIdentityEntity, {
	type AccountIdentityProvider,
} from '@/features/account/account-identity.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class AccountIdentityQuery extends RepositoryAbstract<AccountIdentityEntity> {
	constructor(repository: Repository<AccountIdentityEntity>) {
		super(repository, AccountIdentityEntity.NAME);
	}

	filterByProviderSubject(
		provider: AccountIdentityProvider,
		provider_user_id: string,
	): this {
		this.hasFilter = true;

		return this.filterBy('provider', provider).filterBy(
			'provider_user_id',
			provider_user_id,
		);
	}
}

export const getAccountIdentityRepository = () =>
	dataSource.getRepository(AccountIdentityEntity).extend({
		createQuery() {
			return new AccountIdentityQuery(this);
		},
	});
