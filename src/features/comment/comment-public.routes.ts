import { CommentEntityTypeEnum } from '@/features/comment/comment.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { commentPublicController } = await import(
		'@/features/comment/comment-public.controller'
	);

	const config: FeatureRoutesModule<typeof commentPublicController> = {
		basePath: '/public/comments',
		controller: commentPublicController,
		routes: {
			create: {
				path: '',
				method: 'post',
			},
			/*
			 * Addressed by id, unlike the public rating routes: an author holds many comments on
			 * one target, so the target does not name a row. The id alone authorizes nothing —
			 * `CommentQuery.filterByOwner` narrows the same query to the caller's own rows, so a
			 * request naming somebody else's comment resolves to nothing rather than to a row it
			 * then has to be checked against.
			 */
			update: {
				path: '/:id',
				method: 'put',
				handlers: [validateParamsWhenId('id')],
			},
			delete: {
				path: '/:id',
				method: 'delete',
				handlers: [validateParamsWhenId('id')],
			},
			/*
			 * One segment, so it never collides with `find` below (`/:entity_type/:entity_id`,
			 * two segments) — a permalink resolver asks for a comment by id the same way the
			 * edit and delete routes address one.
			 */
			read: {
				path: '/:id',
				method: 'get',
				handlers: [validateParamsWhenId('id')],
			},
			find: {
				path: '/:entity_type/:entity_id',
				method: 'get',
				handlers: [
					validateParamsWhenId('entity_id'),
					validateParamsWhenEnum({
						entity_type: Object.values(CommentEntityTypeEnum),
					}),
				],
			},
		},
	};

	return config;
};
