import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type UserEntity from '@/features/user/user.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

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

@Entity({
    name: ENTITY_TABLE_NAME,
    schema: 'public',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_comment_created_at', ['entity_type', 'entity_id', 'user_id'], {
    where: 'deleted_at IS NULL',
})
@Index('IDX_complaint_created_at', ['created_at'])
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

    @Column({
        type: 'boolean',
        default: false,
    })
    is_resolved!: boolean;

    // RELATIONS
    @ManyToOne('UserEntity', {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user!: UserEntity;
}
