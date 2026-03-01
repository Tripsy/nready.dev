import PermissionEntity from '@/features/permission/permission.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class PermissionPolicy extends PolicyAbstract {
	constructor() {
		const entity = PermissionEntity.NAME;

		super(entity);
	}
}

export const permissionPolicy = new PermissionPolicy();
