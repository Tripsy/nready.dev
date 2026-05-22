import { NotAllowedError, UnauthorizedError } from '@/exceptions';
import VendorEntity from '@/features/vendor/vendor.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';
import type { AuthContext } from '@/shared/types/express';
import { UserRoleEnum } from '@/shared/types/user-role.type';

export class VendorPolicy extends PolicyAbstract {
	constructor() {
		const entity = VendorEntity.NAME;

		super(entity);
	}

	public canCreate(auth: AuthContext, entity?: string): void {
		if (!this.isAuthenticated(auth)) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('create', entity);

		if (
			this.getRole(auth) !== UserRoleEnum.DRIVER &&
			!this.isAllowed(auth, permission)
		) {
			throw new NotAllowedError();
		}
	}

	public canFind(auth: AuthContext, entity?: string): void {
		if (!this.isAuthenticated(auth)) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('create', entity);

		if (
			this.getRole(auth) !== UserRoleEnum.DRIVER &&
			!this.isAllowed(auth, permission)
		) {
			throw new NotAllowedError();
		}
	}
}

export const vendorPolicy = new VendorPolicy();
