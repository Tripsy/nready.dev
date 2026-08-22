import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import type { CommentEntityType } from '@/features/comment/comment.entity';
import CommentSubscriptionEntity, {
	CommentSubscriptionTypeEnum,
} from '@/features/comment/comment-subscription.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class CommentSubscriptionQuery extends RepositoryAbstract<CommentSubscriptionEntity> {
	constructor(repository: Repository<CommentSubscriptionEntity>) {
		super(repository, CommentSubscriptionEntity.NAME);
	}

	/**
	 * The discussion a subscriber follows, in the order `UQ_comment_subscription_user` holds the
	 * columns — the unique doubles as the fan-out lookup, so the digest run reads it without an
	 * index of its own.
	 */
	filterByTarget(
		entityType?: CommentEntityType | null,
		entityId?: number | null,
	): this {
		this.filterBy('entity_type', entityType);
		this.filterBy('entity_id', entityId);

		return this;
	}

	/**
	 * The unsubscribe credential. A guest subscriber holds no session, so this is the only handle
	 * the public endpoints can authenticate them by — which is why it carries a unique index and
	 * is never guessable.
	 */
	filterByToken(token: string): this {
		this.filterBy('unsubscribe_token', token);

		return this;
	}

	/** Everyone who still wants to hear about the target. */
	filterSubscribed(): this {
		this.filterBy(
			'notification_type',
			CommentSubscriptionTypeEnum.UNSUBSCRIBED,
			'!=',
		);

		return this;
	}
}

export const getCommentSubscriptionRepository = () =>
	dataSource.getRepository(CommentSubscriptionEntity).extend({
		createQuery() {
			return new CommentSubscriptionQuery(this);
		},
	});
