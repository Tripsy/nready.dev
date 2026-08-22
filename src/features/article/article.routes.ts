import {
	ArticleFeaturedStatusEnum,
	ArticleStatusEnum,
} from '@/features/article/article.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { articleController } = await import(
		'@/features/article/article.controller'
	);

	const config: FeatureRoutesModule<typeof articleController> = {
		basePath: '/articles',
		controller: articleController,
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
				path: '/featured/:featured_status/order',
				method: 'patch',
				handlers: [
					validateParamsWhenEnum({
						featured_status: Object.values(
							ArticleFeaturedStatusEnum,
						),
					}),
				],
			},
			statusUpdate: {
				path: '/:id/status/:status',
				method: 'patch',
				handlers: [
					validateParamsWhenId('id'),
					validateParamsWhenEnum({
						status: Object.values(ArticleStatusEnum),
					}),
				],
			},
		},
	};

	return config;
};
