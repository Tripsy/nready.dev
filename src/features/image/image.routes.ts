import type { FeatureRoutesModule } from '@/config/routes.setup';
import { imageController } from '@/features/image/image.controller';
import {
	ImageSectionEnum,
	ImageStatusEnum,
} from '@/features/image/image.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof imageController> = {
	basePath: '/images',
	controller: imageController,
	routes: {
		create: {
			path: '/:section/:entity_id',
			method: 'post',
			handlers: [
				validateParamsWhenEnum({
					section: Object.values(ImageSectionEnum),
				}),
				validateParamsWhenId('entity_id'),
			],
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
		statusUpdate: {
			path: '/:id/status/:status',
			method: 'patch',
			handlers: [
				validateParamsWhenId('id'),
				validateParamsWhenEnum({
					status: Object.values(ImageStatusEnum),
				}),
			],
		},
		orderUpdate: {
			path: '/:section/:entity_id/order',
			method: 'patch',
			handlers: [
				validateParamsWhenEnum({
					section: Object.values(ImageSectionEnum),
				}),
				validateParamsWhenId('entity_id'),
			],
		},
	},
};

const routesConfiguration: FeatureRoutesModule<typeof imageController> = {
	...routesModule,
};

export default routesConfiguration;
