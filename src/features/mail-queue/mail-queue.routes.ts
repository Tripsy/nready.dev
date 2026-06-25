import type { FeatureRoutesModule } from '@/config/routes.setup';
import { mailQueueController } from '@/features/mail-queue/mail-queue.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof mailQueueController> = {
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

const routesConfiguration: FeatureRoutesModule<typeof mailQueueController> = {
	...routesModule,
};

export default routesConfiguration;
