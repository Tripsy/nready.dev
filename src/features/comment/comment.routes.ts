import { CommentStatusEnum } from '@/features/comment/comment.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { commentController } = await import(
		'@/features/comment/comment.controller'
	);

	const config: FeatureRoutesModule<typeof commentController> = {
		basePath: '/comments',
		controller: commentController,
		routes: {
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
			// Hard delete — the table has no `deleted_at`, so there is no `restore` to pair
			// with it, and the replies go with the comment through the cascade.
			delete: {
				path: '/:id',
				method: 'delete',
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
						status: Object.values(CommentStatusEnum),
					}),
				],
			},
		},
	};

	return config;
};
