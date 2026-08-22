import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { discountController } = await import(
		'@/features/discount/discount.controller'
	);

	const config: FeatureRoutesModule<typeof discountController> = {
		basePath: '/discounts',
		controller: discountController,
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
			readTargets: {
				path: '/:id/targets',
				method: 'get',
				handlers: [validateParamsWhenId('id')],
			},
			updateTargets: {
				path: '/:id/targets',
				method: 'put',
				handlers: [validateParamsWhenId('id')],
			},
		},
	};

	return config;
};
