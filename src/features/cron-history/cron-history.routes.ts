import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { cronHistoryController } = await import(
		'@/features/cron-history/cron-history.controller'
	);

	const config: FeatureRoutesModule<typeof cronHistoryController> = {
		basePath: '/cron-history',
		controller: cronHistoryController,
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
