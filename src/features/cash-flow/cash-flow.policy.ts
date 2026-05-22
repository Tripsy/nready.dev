import { NotAllowedError, UnauthorizedError } from '@/exceptions';
import CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';
import type { AuthContext } from '@/shared/types/express';

export class CashFlowPolicy extends PolicyAbstract {
	constructor() {
		const entity = CashFlowEntity.NAME;

		super(entity);
	}

	public canRefund(auth: AuthContext, entity?: string): void {
		if (!this.isAuthenticated(auth)) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('refund', entity);

		if (!this.isAdmin(auth) && !this.hasPermission(auth, permission)) {
			throw new NotAllowedError();
		}
	}
}

export const cashFlowPolicy = new CashFlowPolicy();
