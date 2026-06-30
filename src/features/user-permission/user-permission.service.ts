import { lang } from '@/config/i18n.setup';
import { getUserPermissionRepository } from '@/features/user-permission/user-permission.repository';
import type { UserPermissionValidator } from '@/features/user-permission/user-permission.validator';
import type { ValidatorOutput } from '@/shared/types/mock.type';

export class UserPermissionService {
	constructor(
		private repository: ReturnType<typeof getUserPermissionRepository>,
	) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<UserPermissionValidator, 'create'>,
	) {
		return Promise.all(
			data.permission_ids.map(async (permission_id) => {
				const existingUserPermission = await this.repository
					.createQuery()
					.select(['id', 'deleted_at'])
					.filterBy('user_id', data.user_id)
					.filterBy('permission_id', permission_id)
					.withDeleted()
					.first();

				if (existingUserPermission) {
					if (existingUserPermission.deleted_at) {
						await this.repository.restore(
							existingUserPermission.id,
						);

						return {
							permission_id,
							message: lang('user-permission.success.restore'),
						};
					}

					return {
						permission_id,
						message: lang('user-permission.error.already_exists'),
					};
				}

				await this.repository.save({
					user_id: data.user_id,
					permission_id,
				});

				return {
					permission_id,
					message: lang('user-permission.success.created'),
				};
			}),
		);
	}

	public async delete(user_id: number, permission_id: number) {
		await this.repository
			.createQuery()
			.filterBy('user_id', user_id)
			.filterBy('permission_id', permission_id)
			.delete(true, false, true);
	}

	public async restore(id: number, user_id: number) {
		await this.repository
			.createQuery()
			.filterById(id)
			.filterBy('user_id', user_id)
			.restore();
	}

	public findByFilter(
		data: ValidatorOutput<UserPermissionValidator, 'find'>,
		withDeleted: boolean,
		user_id: number,
	) {
		return this.repository
			.createQuery()
			.join('user_permission.user', 'user')
			.join('user_permission.permission', 'permission')
			.filterBy('user_id', user_id)
			.filterBy('permission.entity', data.filter.entity, 'LIKE')
			.filterBy('permission.operation', data.filter.operation, 'LIKE')
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const userPermissionService = new UserPermissionService(
	getUserPermissionRepository(),
);
