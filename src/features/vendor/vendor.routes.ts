import type { FeatureRoutesModule } from '@/config/routes.setup';
import { vendorController } from '@/features/vendor/vendor.controller';
import { VendorStatusEnum } from '@/features/vendor/vendor.entity';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof vendorController> = {
	basePath: '/vendors',
	controller: vendorController,
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
			handlers: [parseFilterMiddleware],
		},
		statusUpdate: {
			path: '/:id/status/:status',
			method: 'patch',
			handlers: [
				validateParamsWhenId('id'),
				validateParamsWhenEnum({
					status: Object.values(VendorStatusEnum),
				}),
			],
		},
	},
};

const routesConfiguration: FeatureRoutesModule<typeof vendorController> = {
	...routesModule,
};

export default routesConfiguration;
