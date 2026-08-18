import {
	RatingEntityTypeEnum,
	RatingTypeEnum,
} from '@/features/rating/rating.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { ratingPublicController } = await import(
		'@/features/rating/rating-public.controller'
	);

	const config: FeatureRoutesModule<typeof ratingPublicController> = {
		basePath: '/public/ratings',
		controller: ratingPublicController,
		routes: {
			create: {
				path: '',
				method: 'post',
			},
			/*
			 * The target and the rating type address the row; who owns it comes from the
			 * request, never from the path. An `/:id` route would have to be checked against
			 * the caller afterwards, and getting that check wrong lets anyone delete anyone's
			 * rating — the id is simply not the caller's to name.
			 */
			delete: {
				path: '/:entity_type/:entity_id/:type',
				method: 'delete',
				handlers: [
					validateParamsWhenId('entity_id'),
					validateParamsWhenEnum({
						entity_type: Object.values(RatingEntityTypeEnum),
						type: Object.values(RatingTypeEnum),
					}),
				],
			},
			read: {
				path: '/:entity_type/:entity_id',
				method: 'get',
				handlers: [
					validateParamsWhenId('entity_id'),
					validateParamsWhenEnum({
						entity_type: Object.values(RatingEntityTypeEnum),
					}),
				],
			},
		},
	};

	return config;
};
