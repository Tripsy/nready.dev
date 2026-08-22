import CommentEntity from '@/features/comment/comment.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

/**
 * Dashboard authorization only. The public endpoints are open by design — anyone reading an article
 * may comment on it, signed in or not — and are gated by the caller's own identity instead
 * (`CommentQuery.filterByOwner`) rather than by a permission.
 */
export class CommentPolicy extends PolicyAbstract {
	constructor() {
		const entity = CommentEntity.NAME;

		super(entity);
	}
}

export const commentPolicy = new CommentPolicy();
