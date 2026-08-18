import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type UserEntity from '@/features/user/user.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

export const ComplaintEntityTypeEnum = {
	ARTICLE: 'article',
	COMMENT: 'comment',
} as const;

export type ComplaintEntityType =
	(typeof ComplaintEntityTypeEnum)[keyof typeof ComplaintEntityTypeEnum];

export const ComplaintReasonEnum = {
	SPAM: 'spam',
	OFFENSIVE: 'offensive',
	HARASSMENT: 'harassment',
	HATE_SPEECH: 'hate_speech',
	MISINFORMATION: 'misinformation',
	INAPPROPRIATE: 'inappropriate',
	COPYRIGHT: 'copyright',
	OTHER: 'other',
} as const;

export type ComplaintReason =
	(typeof ComplaintReasonEnum)[keyof typeof ComplaintReasonEnum];

const ENTITY_TABLE_NAME = 'complaint';

/**
 * Comments are hard-deleted, so a complaint outliving its target is normal — the row stays for
 * audit, and the moderation queue has to tolerate an `entity_id` that no longer resolves.
 *
 * Reviews are not a target: a review is reported by flagging it through moderation, not here.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
// One complaint per user per target. Scoped to live rows, so a withdrawn complaint can be filed again.
@Index('UQ_complaint_user', ['entity_type', 'entity_id', 'user_id'], {
	unique: true,
	where: 'deleted_at IS NULL',
})
// Moderation queue. Partial: the open set stays small while the table only grows.
@Index('IDX_complaint_open', ['created_at'], {
	where: 'is_resolved = false',
})
@Check('CHK_complaint_resolved', 'is_resolved = (resolved_at IS NOT NULL)')
export default class ComplaintEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = false;

	// Target Entity (Polymorphic)
	@Column({
		type: 'enum',
		enum: ComplaintEntityTypeEnum,
		nullable: false,
	})
	entity_type!: ComplaintEntityType;

	@Column({
		type: 'int',
		nullable: false,
	})
	entity_id!: number;

	@Column('int', { nullable: false })
	@Index('IDX_complaint_user_id')
	user_id!: number;

	@Column({
		type: 'enum',
		enum: ComplaintReasonEnum,
		nullable: false,
	})
	reason!: ComplaintReason;

	@Column('text', { nullable: true })
	description?: string | null;

	// Resolution
	// `is_resolved` is the flag the queue filters on; `resolved_at`/`resolved_by` are the audit
	// trail a disputed moderation decision is answered from. CHK_complaint_resolved keeps the flag
	// and the timestamp from drifting apart.
	@Column({
		type: 'boolean',
		default: false,
	})
	is_resolved!: boolean;

	@Column({
		type: 'timestamp',
		nullable: true,
	})
	resolved_at?: Date | null;

	@Column({
		type: 'int',
		nullable: true,
		comment: 'Moderator user ID',
	})
	resolved_by?: number | null;

	// RELATIONS
	@ManyToOne('UserEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;
}
