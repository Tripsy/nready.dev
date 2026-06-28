import type { FeatureRoutesModule } from '@/config/routes.setup';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

export default async () => {
	const { mailQueueController } = await import(
		'@/features/mail-queue/mail-queue.controller'
	);

	const config: FeatureRoutesModule<typeof mailQueueController> = {
		basePath: '/mail-queue',
		controller: mailQueueController,
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
