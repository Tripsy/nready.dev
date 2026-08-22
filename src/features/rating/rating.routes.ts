import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { ratingController } = await import(
		'@/features/rating/rating.controller'
	);

	const config: FeatureRoutesModule<typeof ratingController> = {
		basePath: '/ratings',
		controller: ratingController,
		routes: {
			read: {
				path: '/:id',
				method: 'get',
				handlers: [validateParamsWhenId('id')],
			},
			// Hard delete — the table has no `deleted_at`, so there is no `restore` to pair
			// with it and nothing to undo the removal of a row.
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
