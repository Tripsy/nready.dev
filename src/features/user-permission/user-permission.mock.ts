import type UserPermissionEntity from '@/features/user-permission/user-permission.entity';
import {
	OrderByEnum,
	UserPermissionValidator,
} from '@/features/user-permission/user-permission.validator';
import { createPastDate } from '@/helpers/date.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

const userPermissionValidator = new UserPermissionValidator('user_permission');

export function getUserPermissionEntityMock(): UserPermissionEntity {
	return {
		id: 1,
		user_id: 1,
		permission_id: 1,
		created_at: createPastDate(86400),
		deleted_at: null,
	};
}

export const userPermissionInputPayloads = {
	create: {
		user_id: 1,
		permission_ids: [1, 2],
	},
	find: {
		user_id: 1,
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			entity: 'user',
			operation: 'create',
			is_deleted: false,
		},
	},
};

export const userPermissionOutputPayloads = {
	create: userPermissionValidator.create.parse(
		userPermissionInputPayloads.create,
	),
	find: userPermissionValidator.find.parse(userPermissionInputPayloads.find),
};
