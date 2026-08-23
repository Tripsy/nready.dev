import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { statsController } = await import(
		'@/features/stats/stats.controller'
	);

	const config: FeatureRoutesModule<typeof statsController> = {
		basePath: '/stats',
		controller: statsController,
		routes: {
			recentActivity: {
				path: '/recent-activity',
				method: 'get',
			},
			recentCounts: {
				path: '/recent-counts',
				method: 'get',
			},
			pendingReview: {
				path: '/pending-review',
				method: 'get',
			},
			sumExpenses: {
				path: '/sum-expenses',
				method: 'get',
			},
			sumRevenues: {
				path: '/sum-revenues',
				method: 'get',
			},
		},
	};

	return config;
};
