import UserEntity from '@/features/user/user.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class UserPolicy extends PolicyAbstract {
	constructor() {
		const entity = UserEntity.NAME;

		super(entity);
	}
}

export const userPolicy = new UserPolicy();
