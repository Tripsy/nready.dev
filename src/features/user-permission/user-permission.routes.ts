import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { userPermissionController } = await import(
		'@/features/user-permission/user-permission.controller'
	);

	/*
	 * Mounted on its own base path rather than nested under `/users`: the grants are a
	 * resource of their own, gated by the `permission` entity and not by `user`, and sharing
	 * a base path with the `user` module left two route modules indistinguishable wherever
	 * they are listed by path.
	 */
	const config: FeatureRoutesModule<typeof userPermissionController> = {
		basePath: '/user-permissions',
		controller: userPermissionController,
		routes: {
			create: {
				path: '/:user_id',
				method: 'post',
				handlers: [validateParamsWhenId('user_id')],
			},
			delete: {
				path: '/:user_id/:permission_id',
				method: 'delete',
				handlers: [validateParamsWhenId('user_id', 'permission_id')],
			},
			restore: {
				path: '/:user_id/:permission_id/restore',
				method: 'patch',
				handlers: [validateParamsWhenId('user_id', 'permission_id')],
			},
			find: {
				path: '/:user_id',
				method: 'get',
				handlers: [validateParamsWhenId('user_id')],
			},
		},
	};

	return config;
};
