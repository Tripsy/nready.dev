import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { documentSeriesController } = await import(
		'@/features/document-series/document-series.controller'
	);

	const config: FeatureRoutesModule<typeof documentSeriesController> = {
		basePath: '/document-series',
		controller: documentSeriesController,
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
			find: {
				path: '',
				method: 'get',
			},
		},
	};

	return config;
};
