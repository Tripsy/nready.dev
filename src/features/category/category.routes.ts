import {
	CategoryStatusEnum,
	CategoryTypeEnum,
} from '@/features/category/category.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { categoryController } = await import(
		'@/features/category/category.controller'
	);

	const config: FeatureRoutesModule<typeof categoryController> = {
		basePath: '/categories',
		controller: categoryController,
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
			orderUpdate: {
				path: '/:type/order',
				method: 'patch',
				handlers: [
					validateParamsWhenEnum({
						type: Object.values(CategoryTypeEnum),
					}),
				],
			},
			statusUpdate: {
				path: '/:id/status/:status',
				method: 'patch',
				handlers: [
					validateParamsWhenId('id'),
					validateParamsWhenEnum({
						status: [
							CategoryStatusEnum.ACTIVE,
							CategoryStatusEnum.INACTIVE,
						],
					}),
				],
			},
		},
	};

	return config;
};
