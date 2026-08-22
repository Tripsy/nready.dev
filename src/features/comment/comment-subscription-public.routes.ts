import type { FeatureRoutesModule } from '@/shared/types/routes.type';

/**
 * Addressed by the unsubscribe token rather than by id: the token is both the address of the row
 * and the only credential its holder has, so the path names exactly one subscription the caller
 * may write by construction.
 */
export default async () => {
	const { commentSubscriptionPublicController } = await import(
		'@/features/comment/comment-subscription-public.controller'
	);

	const config: FeatureRoutesModule<
		typeof commentSubscriptionPublicController
	> = {
		basePath: '/public/comment-subscriptions',
		controller: commentSubscriptionPublicController,
		routes: {
			read: {
				path: '/:token',
				method: 'get',
			},
			update: {
				path: '/:token',
				method: 'put',
			},
		},
	};

	return config;
};
