import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { templatePublicController } = await import(
		'@/features/template/template-public.controller'
	);

	const config: FeatureRoutesModule<typeof templatePublicController> = {
		basePath: '/public/pages',
		controller: templatePublicController,
		routes: {
			read: {
				path: '/:label',
				method: 'get',
			},
		},
	};

	return config;
};
