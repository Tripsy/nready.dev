import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { logHistoryController } = await import(
		'@/features/log-history/log-history.controller'
	);

	const config: FeatureRoutesModule<typeof logHistoryController> = {
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

	return config;
};
