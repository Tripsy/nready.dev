import { userController } from '@/features/user/user.controller';
import { UserStatusEnum } from '@/features/user/user.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

const routesModule: FeatureRoutesModule<typeof userController> = {
	basePath: '/users',
	controller: userController,
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
		statusUpdate: {
			path: '/:id/status/:status',
			method: 'patch',
			handlers: [
				validateParamsWhenId('id'),
				validateParamsWhenEnum({
					status: Object.values(UserStatusEnum),
				}),
			],
		},
	},
};

const routesConfiguration: FeatureRoutesModule<typeof userController> = {
	...routesModule,
};

export default routesConfiguration;
