import type { FeatureRoutesModule } from '@/config/routes.setup';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

export default async () => {
	const { permissionController } = await import(
		'@/features/permission/permission.controller'
	);

	const config: FeatureRoutesModule<typeof permissionController> = {
		basePath: '/permissions',
		controller: permissionController,
		routes: {
			create: {
				path: '',
				method: 'post',
			},
			read: {
				path: '/:id',
				method: 'get',
				handlers: [validateParamsWhenId('id')],
			},
			update: {
				path: '/:id',
				method: 'put',
				handlers: [validateParamsWhenId('id')],
			},
			delete: {
				path: '/:id',
				method: 'delete',
				handlers: [validateParamsWhenId('id')],
			},
			restore: {
				path: '/:id/restore',
				method: 'patch',
				handlers: [validateParamsWhenId('id')],
			},
			find: {
				path: '',
				method: 'get',
			},
		},
	};

	return config;
};
