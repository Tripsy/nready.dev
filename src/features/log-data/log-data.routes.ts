import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { logDataController } = await import(
		'@/features/log-data/log-data.controller'
	);

	const config: FeatureRoutesModule<typeof logDataController> = {
		basePath: '/log-data',
		controller: logDataController,
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
