import type { FeatureRoutesModule } from '@/config/routes.setup';
import { userPermissionController } from '@/features/user-permission/user-permission.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof userPermissionController> = {
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

const routesConfiguration: FeatureRoutesModule<
	typeof userPermissionController
> = {
	...routesModule,
};

export default routesConfiguration;
