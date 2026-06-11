import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import type SubscriptionEntity from '@/features/subscription/subscription.entity';

export const SubscriptionEvidenceStatusEnum = {
	SUCCESS: 'success',
	FAILED: 'failed',
} as const;

export type SubscriptionEvidenceStatus =
	(typeof SubscriptionEvidenceStatusEnum)[keyof typeof SubscriptionEvidenceStatusEnum];

const ENTITY_TABLE_NAME = 'subscription_evidence';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Used to track renewal attempts for subscriptions.',
})
export default class SubscriptionEvidenceEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@Column('int', { nullable: false })
	@Index('IDX_subscription_evidence_subscription_id')
	subscription_id!: number;

	@Column('int', { nullable: false })
	@Index('IDX_subscription_evidence_invoice_id')
	invoice_id!: number;

	@Column({
		type: 'enum',
		enum: SubscriptionEvidenceStatusEnum,
		nullable: false,
	})
	@Index('IDX_subscription_evidence_status')
	status!: SubscriptionEvidenceStatus;

	@Column('jsonb', {
		nullable: true,
		comment:
			'Response data from the payment gateway. For example: { "transaction_id": "1234567890" }',
	})
	response_data!: Record<string, unknown> | null;

	@Column('text', { nullable: true })
	fail_reason!: string | null;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	recorded_at!: Date;

	// RELATIONS
	@ManyToOne('SubscriptionEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'subscription_id' })
	subscription!: SubscriptionEntity;
}
