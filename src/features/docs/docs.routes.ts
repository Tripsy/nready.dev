import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { docsController } = await import('@/features/docs/docs.controller');

	const config: FeatureRoutesModule<typeof docsController> = {
		basePath: '/docs',
		controller: docsController,
		routes: {
			read: {
				path: '/:feature',
				method: 'get',
			},
		},
	};

	return config;
};
