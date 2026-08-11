import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import AccountIdentityEntity from '@/features/account/account-identity.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class AccountIdentityQuery extends RepositoryAbstract<AccountIdentityEntity> {
	constructor(repository: Repository<AccountIdentityEntity>) {
		super(repository, AccountIdentityEntity.NAME);
	}
}

export const getAccountIdentityRepository = () =>
	dataSource.getRepository(AccountIdentityEntity).extend({
		createQuery() {
			return new AccountIdentityQuery(this);
		},
	});
