import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { apiDocsController } = await import(
		'@/features/api-docs/api-docs.controller'
	);

	const config: FeatureRoutesModule<typeof apiDocsController> = {
		basePath: '/public/api-docs',
		controller: apiDocsController,
		routes: {
			find: {
				path: '',
				method: 'get',
			},
			read: {
				path: '/:feature',
				method: 'get',
			},
		},
	};

	return config;
};
