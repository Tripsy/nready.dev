import AddressEntity from '@/features/address/address.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class AddressPolicy extends PolicyAbstract {
	constructor() {
		const entity = AddressEntity.NAME;

		super(entity);
	}
}

export const addressPolicy = new AddressPolicy();
