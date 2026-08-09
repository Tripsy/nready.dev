import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { articlePublicController } = await import(
		'@/features/article/article-public.controller'
	);

	const config: FeatureRoutesModule<typeof articlePublicController> = {
		basePath: '/public/articles',
		controller: articlePublicController,
		routes: {
			find: {
				path: '',
				method: 'get',
			},
			read: {
				path: '/:slug',
				method: 'get',
			},
		},
	};

	return config;
};
