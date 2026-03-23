import type PermissionEntity from '@/features/permission/permission.entity';
import {
	PermissionOrderByEnum,
	permissionValidator,
} from '@/features/permission/permission.validator';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getPermissionEntityMock(): PermissionEntity {
	return {
		id: 1,
		entity: 'user',
		operation: 'create',
		deleted_at: null,
	};
}

export const permissionInputPayloads = {
	manage: {
		entity: 'user',
		operation: 'create',
	},
	find: {
		page: 1,
		limit: 10,
		order_by: PermissionOrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'user',
			is_deleted: false,
		},
	},
};

export const permissionOutputPayloads = {
	manage: permissionValidator.manage.parse(permissionInputPayloads.manage),
	find: permissionValidator.find.parse(permissionInputPayloads.find),
};
