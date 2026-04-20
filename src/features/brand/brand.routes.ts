import type { FeatureRoutesModule } from '@/config/routes.setup';
import { brandController } from '@/features/brand/brand.controller';
import { BrandStatusEnum, BrandTypeEnum } from '@/features/brand/brand.entity';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
	validateParamsWhenString,
} from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof brandController> = {
	basePath: '/brands',
	controller: brandController,
	routes: {
		create: {
			path: '',
			method: 'post',
		},
		read: {
			path: '/:id',
			method: 'get',
			handlers: [
				validateParamsWhenId('id'),
				validateParamsWhenString('language'),
			],
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
					status: Object.values(BrandStatusEnum),
				}),
			],
		},
		orderUpdate: {
			path: '/:type/order',
			method: 'patch',
			handlers: [
				validateParamsWhenEnum({
					type: Object.values(BrandTypeEnum),
				}),
			],
		},
	},
};

const routesConfiguration: FeatureRoutesModule<typeof brandController> = {
	...routesModule,
};

export default routesConfiguration;
