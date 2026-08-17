import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type UserEntity from '@/features/user/user.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

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

const ENTITY_TABLE_NAME = 'rating';

@Entity({
    name: ENTITY_TABLE_NAME,
    schema: 'public',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
export class ComplaintEntity extends EntityAbstract {
    static readonly NAME: string = ENTITY_TABLE_NAME;
    static readonly HAS_CACHE: boolean = false;

    // Target Entity (Polymorphic)
    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
    })
    @Index('IDX_comment_entity_type')
    entity_type!: string; // 'article', 'product', etc.

    @Column({
        type: 'int',
        nullable: false,
    })
    @Index('IDX_comment_entity_id')
    entity_id!: number;

    @Column('int', { nullable: false })
    @Index('IDX_comment_report_user_id')
    user_id!: number;

    @Column({
        type: 'enum',
        enum: ComplaintReasonEnum,
        nullable: false,
    })
    reason!: ComplaintReason;

    @Column('text', { nullable: true })
    description?: string | null;

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

    @Column('int', { nullable: true })
    resolved_by?: number | null;

    @ManyToOne('UserEntity', {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user!: UserEntity;
}
