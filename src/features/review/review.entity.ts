import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductEntity from '@/features/product/product.entity';
import type UserEntity from '@/features/user/user.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';
import { numericTransformer } from '@/shared/transformers/numeric.transformer';
import type { StatusTransitions } from '@/shared/types/common.type';

export const ReviewStatusEnum = {
	PENDING: 'pending', // Awaiting moderation
	REJECTED: 'rejected', // Rejected by moderator
	SPAM: 'spam', // Marked as spam
	APPROVED: 'approved', // Visible to public
} as const;

export type ReviewStatus =
	(typeof ReviewStatusEnum)[keyof typeof ReviewStatusEnum];

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<ReviewStatus> = {
	[ReviewStatusEnum.PENDING]: [
		ReviewStatusEnum.REJECTED,
		ReviewStatusEnum.SPAM,
		ReviewStatusEnum.APPROVED,
	],
	[ReviewStatusEnum.REJECTED]: [ReviewStatusEnum.APPROVED],
	[ReviewStatusEnum.SPAM]: [
		ReviewStatusEnum.REJECTED,
		ReviewStatusEnum.APPROVED,
	],
	[ReviewStatusEnum.APPROVED]: [
		ReviewStatusEnum.REJECTED,
		ReviewStatusEnum.SPAM,
	],
};

/**
 * The dimensions a reviewer may score, each out of 5. A review carries at least one of them and
 * nothing else — `CHK_review_rating_keys` holds both halves of that rule.
 *
 * The list is repeated as SQL literals in the checks below, since a decorator takes a fixed string.
 * Adding a dimension means a migration; dropping one leaves the older rows carrying it, so read
 * every dimension as optional no matter what the current list says.
 */
export const REVIEW_RATING_DIMENSIONS = [
	'quality',
	'price',
	'service',
	'delivery',
] as const;

export type ReviewRatingDimension = (typeof REVIEW_RATING_DIMENSIONS)[number];

export type ReviewRating = Partial<Record<ReviewRatingDimension, number>>;

export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;

const ENTITY_TABLE_NAME = 'review';

/**
 * A product review: the score and the text a buyer leaves, moderated the same way a comment is.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores product reviews',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_review_product', ['product_id', 'status', 'created_at'])
// Product average and the "4 stars and up" filter, both of which read only public rows.
@Index('IDX_review_product_rating', ['product_id', 'rating_avg'], {
	where: `status = 'approved' AND deleted_at IS NULL`,
})
// Moderation queue. Partial: only `pending` rows are ever listed this way, and the table is
// dominated by rows that have already left that state.
@Index('IDX_review_moderation', ['created_at'], {
	where: `status = 'pending' AND deleted_at IS NULL`,
})
@Index('IDX_review_user_status', ['user_id', 'status'])
// One review per user per product; a withdrawn review leaves the slot free for a new one.
@Index('UQ_review_user', ['product_id', 'user_id'], {
	unique: true,
	where: 'deleted_at IS NULL',
})
@Check(
	'CHK_review_rating_avg_range',
	`rating_avg BETWEEN ${REVIEW_RATING_MIN} AND ${REVIEW_RATING_MAX}`,
)
/**
 * Shape of `rating`: an object holding at least one known dimension, no unknown key, and a number
 * within range under each key present.
 *
 * Subtracting the known keys leaves `{}` only when no unknown key is there, and `?|` then demands
 * at least one. Values are compared as jsonb rather than cast to numeric: a cast over a string
 * value raises `22P02` instead of failing the constraint, which reaches the client as a masked 500
 * rather than a validation error. jsonb ordering sorts strings above every number, so a
 * non-numeric value falls outside the range on its own — the `jsonb_typeof` guard states the rule
 * regardless. It reads worse than a `jsonb_each` subquery would, which Postgres forbids here.
 */
@Check(
	'CHK_review_rating',
	`jsonb_typeof(rating) = 'object'
	 AND rating - 'quality' - 'price' - 'service' - 'delivery' = '{}'::jsonb
	 AND rating ?| array['quality', 'price', 'service', 'delivery']
	 AND (NOT rating ? 'quality' OR (jsonb_typeof(rating->'quality') = 'number' AND rating->'quality' BETWEEN '${REVIEW_RATING_MIN}'::jsonb AND '${REVIEW_RATING_MAX}'::jsonb))
	 AND (NOT rating ? 'price' OR (jsonb_typeof(rating->'price') = 'number' AND rating->'price' BETWEEN '${REVIEW_RATING_MIN}'::jsonb AND '${REVIEW_RATING_MAX}'::jsonb))
	 AND (NOT rating ? 'service' OR (jsonb_typeof(rating->'service') = 'number' AND rating->'service' BETWEEN '${REVIEW_RATING_MIN}'::jsonb AND '${REVIEW_RATING_MAX}'::jsonb))
	 AND (NOT rating ? 'delivery' OR (jsonb_typeof(rating->'delivery') = 'number' AND rating->'delivery' BETWEEN '${REVIEW_RATING_MIN}'::jsonb AND '${REVIEW_RATING_MAX}'::jsonb))`,
)
export default class ReviewEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column({
		type: 'int',
		nullable: false,
	})
	product_id!: number;

	@Column({
		type: 'jsonb',
		nullable: false,
		comment: 'Scores out of 5, keyed by dimension',
	})
	rating!: ReviewRating;

	/**
	 * The review's star score: the dimensions set in `rating` summed and divided by how many were
	 * set — `(quality + price + service + delivery) / 4` when all four are given, `(quality +
	 * service) / 2` when only those two are. Never divided by the number of dimensions that exist,
	 * which would score a partly-filled review as though the blanks were zeros. `CHK_review_rating`
	 * guarantees at least one is present, so the divisor is never zero, and each is at least 1, so
	 * the result stays inside the 1-5 that `CHK_review_rating_avg_range` holds.
	 *
	 * Written by `ReviewService` on every write, rounded to the column's 2 decimals there rather
	 * than left to Postgres — (5 + 4 + 4) / 3 stores as 4.33.
	 *
	 * This is what a product average aggregates and what a star filter compares against:
	 * `AVG(rating_avg)` over a plain column, instead of unpacking jsonb per row and deciding there
	 * how a review scored on three dimensions compares to one scored on four. Denormalized, so it
	 * holds only as well as the service maintains it.
	 */
	@Column('decimal', {
		precision: 3,
		scale: 2,
		nullable: false,
		transformer: numericTransformer,
	})
	rating_avg!: number;

	@Column({
		type: 'text',
		nullable: false,
	})
	content!: string;

	@Column({
		type: 'enum',
		enum: ReviewStatusEnum,
		default: ReviewStatusEnum.PENDING,
		nullable: false,
	})
	status!: ReviewStatus;

	// Author — always a registered user, which is what `UQ_review_user` counts on to hold one
	// review per product.
	@Column({
		type: 'int',
		nullable: false,
	})
	user_id!: number;

	// Replies are comments targeting this review; the count moves with them.
	@Column({
		type: 'int',
		default: 0,
	})
	reply_count!: number;

	// Flags
	@Column({
		type: 'boolean',
		default: false,
	})
	is_pinned!: boolean;

	@Column({
		type: 'boolean',
		default: false,
		comment: 'Verified buyer',
	})
	is_verified!: boolean;

	// Moderation
	@Column({
		type: 'timestamp',
		nullable: true,
	})
	moderated_at?: Date | null;

	@Column({
		type: 'int',
		nullable: true,
		comment: 'Moderator user ID',
	})
	moderated_by?: number | null;

	@Column({
		type: 'varchar',
		nullable: true,
		comment: 'Reason for moderation action',
	})
	moderation_reason?: string | null;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product?: ProductEntity;

	// Cascade is forced by `user_id` being NOT NULL — there is no anonymous state to fall back to,
	// so a closed account takes its reviews with it and every product average it fed has to be
	// recomputed.
	@ManyToOne('UserEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity;
}
