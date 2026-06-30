import { NotAllowedError } from '@/exceptions';
import CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';
import type { AuthContext } from '@/shared/types/express';

export class CashFlowPolicy extends PolicyAbstract {
	constructor() {
		const entity = CashFlowEntity.NAME;

		super(entity);
	}

	public canRefund(auth: AuthContext): void {
		this.requiredAuth(auth);

		if (this.isAdmin(auth)) {
			return;
		}

		if (!this.hasPermission(auth, this.entity, 'refund')) {
			throw new NotAllowedError();
		}
	}
}

export const cashFlowPolicy = new CashFlowPolicy();
