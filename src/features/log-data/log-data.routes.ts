import type { FeatureRoutesModule } from '@/config/routes.setup';
import { logDataController } from '@/features/log-data/log-data.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof logDataController> = {
	basePath: '/log-data',
	controller: logDataController,
	routes: {
		read: {
			path: '/:id',
			method: 'get',
			handlers: [validateParamsWhenId('id')],
		},
		delete: {
			path: '',
			method: 'delete',
		},
		find: {
			path: '',
			method: 'get',
		},
	},
};

const routesConfiguration: FeatureRoutesModule<typeof logDataController> = {
	...routesModule,
};

export default routesConfiguration;
