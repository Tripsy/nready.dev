import type { FeatureRoutesModule } from '@/config/routes.setup';
import { clientAddressController } from '@/features/client-address/client-address.controller';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof clientAddressController> = {
	basePath: '/client-address',
	controller: clientAddressController,
	routes: {
		create: {
			path: '/:client_id',
			method: 'post',
			handlers: [validateParamsWhenId('client_id')],
		},
		read: {
			path: '/:client_id/:id',
			method: 'get',
			handlers: [validateParamsWhenId('client_id', 'id')],
		},
		update: {
			path: '/:client_id/:id',
			method: 'put',
			handlers: [validateParamsWhenId('client_id', 'id')],
		},
		delete: {
			path: '/:client_id/:id',
			method: 'delete',
			handlers: [validateParamsWhenId('client_id', 'id')],
		},
		restore: {
			path: '/:client_id/:id/restore',
			method: 'patch',
			handlers: [validateParamsWhenId('client_id', 'id')],
		},
		find: {
			path: '',
			method: 'get',
			handlers: [parseFilterMiddleware],
		},
	},
};

const routesConfiguration: FeatureRoutesModule<typeof clientAddressController> =
	{
		...routesModule,
	};

export default routesConfiguration;
