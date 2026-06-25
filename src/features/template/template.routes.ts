import type { FeatureRoutesModule } from '@/config/routes.setup';
import { templateController } from '@/features/template/template.controller';
import { validateParamsWhenId } from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof templateController> = {
	basePath: '/templates',
	controller: templateController,
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
		readPage: {
			path: '/:label/page',
			method: 'get',
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
	},
};

const routesConfiguration: FeatureRoutesModule<typeof templateController> = {
	...routesModule,
};

export default routesConfiguration;
