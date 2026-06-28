import type { FeatureRoutesModule } from '@/config/routes.setup';
import { BrandStatusEnum, BrandTypeEnum } from '@/features/brand/brand.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';

export default async () => {
	const { brandController } = await import(
		'@/features/brand/brand.controller'
	);

	const config: FeatureRoutesModule<typeof brandController> = {
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
						status: Object.values(BrandStatusEnum),
					}),
				],
			},
			orderUpdate: {
				path: '/:brand_type/order',
				method: 'patch',
				handlers: [
					validateParamsWhenEnum({
						brand_type: Object.values(BrandTypeEnum),
					}),
				],
			},
		},
	};

	return config;
};
