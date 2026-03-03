import CarrierEntity from '@/features/carrier/carrier.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class CarrierPolicy extends PolicyAbstract {
	constructor() {
		const entity = CarrierEntity.NAME;

		super(entity);
	}
}

export const carrierPolicy = new CarrierPolicy();
