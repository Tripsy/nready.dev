import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { categoryPublicController } = await import(
		'@/features/category/category-public.controller'
	);

	const config: FeatureRoutesModule<typeof categoryPublicController> = {
		basePath: '/public/categories',
		controller: categoryPublicController,
		routes: {
			find: {
				path: '',
				method: 'get',
			},
		},
	};

	return config;
};
