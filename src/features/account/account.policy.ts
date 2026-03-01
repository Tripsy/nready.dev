import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class AccountPolicy extends PolicyAbstract {
	constructor() {
		const entity = 'account';

		super(entity);
	}
}

export const accountPolicy = new AccountPolicy();
