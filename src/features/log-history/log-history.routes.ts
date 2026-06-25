import type { FeatureRoutesModule } from '@/config/routes.setup';
import { logHistoryController } from '@/features/log-history/log-history.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof logHistoryController> = {
	basePath: '/log-history',
	controller: logHistoryController,
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

const routesConfiguration: FeatureRoutesModule<typeof logHistoryController> = {
	...routesModule,
};

export default routesConfiguration;
