import type { FeatureRoutesModule } from '@/config/routes.setup';
import { clientController } from '@/features/client/client.controller';
import { ClientStatusEnum } from '@/features/client/client.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof clientController> = {
	basePath: '/clients',
	controller: clientController,
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
					status: Object.values(ClientStatusEnum),
				}),
			],
		},
	},
};

const routesConfiguration: FeatureRoutesModule<typeof clientController> = {
	...routesModule,
};

export default routesConfiguration;
