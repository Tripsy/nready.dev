import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type UserEntity from '@/features/user/user.entity';
import { EntityAppendOnlyAbstract } from '@/shared/abstracts/entity-append-only.abstract';

export const RatingEntityTypeEnum = {
	ARTICLE: 'article',
	COMMENT: 'comment',
} as const;

export type RatingEntityType =
	(typeof RatingEntityTypeEnum)[keyof typeof RatingEntityTypeEnum];

export const RatingTypeEnum = {
	LIKE: 'like', // Saved as value: 1 or -1
	STARS: 'stars', // Saved as value: 1-5
	EMOJI: 'emoji', // Saved as reaction
} as const;

export type RatingType = (typeof RatingTypeEnum)[keyof typeof RatingTypeEnum];

export const RatingEmojiEnum = {
	LIKE: 'like',
	DISLIKE: 'dislike',
	LOVE: 'love',
	INSIGHTFUL: 'insightful',
	FUNNY: 'funny',
} as const;

export type RatingEmoji =
	(typeof RatingEmojiEnum)[keyof typeof RatingEmojiEnum];

const ENTITY_TABLE_NAME = 'rating';

/**
 * Insert-only: a row records that someone rated something, and is never edited afterwards. The
 * uniques below mean re-rating is a delete followed by an insert — the one write that is not an
 * append, and a hard one, since there is no `deleted_at` to soft-delete into.
 *
 * A rating is rationed twice over — once per origin address and once per account — so both uniques
 * have to be reckoned with on write: an insert can collide on either, and the two say different
 * things to the caller ("you already rated this" against "this address already has").
 *
 * `user_ip_hash` is required on every row, signed in or not. A request whose address cannot be
 * resolved is rejected rather than stored under a fallback hash, which would collapse every such
 * request into a single shared vote per target.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
})
// One rating per target per origin, signed in or not: the address is what is actually being
// rationed, so a second account does not buy a second vote. Two people sharing an address — a
// household, an office, a mobile carrier's NAT — get one vote between them, which is the cost of
// counting by origin rather than by identity.
@Index('UQ_rating_ip', ['entity_type', 'entity_id', 'type', 'user_ip_hash'], {
	unique: true,
})
// And one per account whatever the address, which the index above does not imply: the same user
// rating from a phone and then a laptop arrives under two different hashes. Partial, because
// Postgres counts NULL `user_id` values as distinct and would let every guest row through anyway.
@Index('UQ_rating_user', ['entity_type', 'entity_id', 'type', 'user_id'], {
	unique: true,
	where: 'user_id IS NOT NULL',
})
// Aggregates read members and guests together, which the partial unique above cannot serve:
// Postgres picks a partial index only when the query implies its predicate.
@Index('IDX_rating_entity', ['entity_type', 'entity_id', 'type'])
@Check('CHK_rating_reaction', `(type = 'emoji') = (reaction IS NOT NULL)`)
@Check('CHK_rating_value', `(type = 'emoji') = (value IS NULL)`)
@Check('CHK_rating_like_range', `type <> 'like' OR value IN (-1, 1)`)
@Check('CHK_rating_stars_range', `type <> 'stars' OR value BETWEEN 1 AND 5`)
export default class RatingEntity extends EntityAppendOnlyAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = false;

	// Target Entity (Polymorphic)
	@Column({
		type: 'enum',
		enum: RatingEntityTypeEnum,
		nullable: false,
	})
	entity_type!: RatingEntityType;

	@Column({
		type: 'enum',
		enum: RatingTypeEnum,
		nullable: false,
	})
	type!: RatingType;

	@Column({
		type: 'int',
		nullable: false,
	})
	entity_id!: number;

	@Column({
		type: 'int',
		nullable: true,
	})
	user_id?: number | null;

	@Column({
		type: 'varchar',
		comment: 'Recorded IP address (hashed for privacy)',
	})
	user_ip_hash!: string;

	@Column({
		type: 'int',
		nullable: true,
	})
	value?: number | null;

	@Column({ type: 'enum', enum: RatingEmojiEnum, nullable: true })
	reaction?: RatingEmoji | null;

	// RELATIONS
	// Cascade rather than SET NULL: nulling `user_id` moves the row under `UQ_rating_guest`, where
	// a guest rating from the same IP hash on the same target collides and fails the account
	// deletion outright.
	@ManyToOne('UserEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity;
}
