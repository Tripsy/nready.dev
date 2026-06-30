import VendorEntity from '@/features/vendor/vendor.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class VendorPolicy extends PolicyAbstract {
	constructor() {
		const entity = VendorEntity.NAME;

		super(entity);
	}
}

export const vendorPolicy = new VendorPolicy();
