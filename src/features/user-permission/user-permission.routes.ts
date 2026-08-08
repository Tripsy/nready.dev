import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { userPermissionController } = await import(
		'@/features/user-permission/user-permission.controller'
	);

	const config: FeatureRoutesModule<typeof userPermissionController> = {
		basePath: '/users',
		controller: userPermissionController,
		routes: {
			create: {
				path: '/:user_id/permissions',
				method: 'post',
				handlers: [validateParamsWhenId('user_id')],
			},
			delete: {
				path: '/:user_id/permissions/:permission_id',
				method: 'delete',
				handlers: [validateParamsWhenId('user_id', 'permission_id')],
			},
			restore: {
				path: '/:user_id/permissions/:id/restore',
				method: 'patch',
				handlers: [validateParamsWhenId('user_id', 'id')],
			},
			find: {
				path: '/:user_id/permissions',
				method: 'get',
				handlers: [validateParamsWhenId('user_id')],
			},
		},
	};

	return config;
};
