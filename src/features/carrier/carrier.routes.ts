import type { FeatureRoutesModule } from '@/config/routes.setup';
import { carrierController } from '@/features/carrier/carrier.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof carrierController> = {
	basePath: '/carriers',
	controller: carrierController,
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

const routesConfiguration: FeatureRoutesModule<typeof carrierController> = {
	...routesModule,
};

export default routesConfiguration;
