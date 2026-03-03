import ClientEntity from '@/features/client/client.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class ClientPolicy extends PolicyAbstract {
	constructor() {
		const entity = ClientEntity.NAME;

		super(entity);
	}
}

export const clientPolicy = new ClientPolicy();
