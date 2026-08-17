import {
    Check,
    Column, CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import type UserEntity from '@/features/user/user.entity';
import {StatusTransitions} from "@/shared/types/common.type";

export const CommentEntityTypeEnum = {
    PRODUCT: 'product',
    ARTICLE: 'article',
} as const;

export type CommentEntityType =
    (typeof CommentEntityTypeEnum)[keyof typeof CommentEntityTypeEnum];

export const CommentStatusEnum = {
    PENDING: 'pending',           // Awaiting moderation
    REJECTED: 'rejected',        // Rejected by moderator
    SPAM: 'spam',                // Marked as spam
    APPROVED: 'approved',         // Visible to public
    FLAGGED: 'flagged',          // Reported by users
} as const;

export type CommentStatus =
    (typeof CommentStatusEnum)[keyof typeof CommentStatusEnum];

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<CommentStatus> = {
    [CommentStatusEnum.PENDING]: [
        CommentStatusEnum.REJECTED,
        CommentStatusEnum.SPAM,
        CommentStatusEnum.APPROVED,
    ],
    [CommentStatusEnum.REJECTED]: [
        CommentStatusEnum.APPROVED,
    ],
    [CommentStatusEnum.SPAM]: [
        CommentStatusEnum.REJECTED,
        CommentStatusEnum.APPROVED,
    ],
    [CommentStatusEnum.APPROVED]: [
        CommentStatusEnum.FLAGGED,
        CommentStatusEnum.REJECTED,
        CommentStatusEnum.SPAM,
    ],
    [CommentStatusEnum.FLAGGED]: [
        CommentStatusEnum.REJECTED,
        CommentStatusEnum.SPAM,
        CommentStatusEnum.APPROVED,
    ],
};

export const CommentTypeEnum = {
    COMMENT: 'comment',           // Regular comment
    REVIEW: 'review',            // Product review with rating
    QUESTION: 'question',        // Question
    TIP: 'tip',                  // Helpful tip / note
} as const;

export type CommentType =
    (typeof CommentTypeEnum)[keyof typeof CommentTypeEnum];

const ENTITY_TABLE_NAME = 'comment';

@Entity({
    name: ENTITY_TABLE_NAME,
    schema: 'public',
    comment: 'Stores all user comments, reviews',
})
@Index('IDX_comment_entity', ['entity_type', 'entity_id', 'type', 'status', 'created_at DESC'])
@Index('IDX_comment_created_at', ['created_at'])
@Index('IDX_comment_user_status', ['user_id', 'status'])
@Index('IDX_comment_user_ip_hash', ['user_ip_hash', 'created_at'])
@Check(`user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL)`)
export default class CommentEntity {
    static readonly NAME: string = ENTITY_TABLE_NAME;
    static readonly HAS_CACHE: boolean = true;

    @PrimaryGeneratedColumn({ type: 'int' })
    id!: number;

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;

    // Target Entity (Polymorphic)
    @Column({
        type: 'enum',
        enum: CommentEntityTypeEnum,
        nullable: false,
    })
    entity_type!: CommentEntityType;

    @Column({
        type: 'int',
        nullable: false,
    })
    entity_id!: number;

    @Column({
        type: 'enum',
        enum: CommentTypeEnum,
        default: CommentTypeEnum.COMMENT,
        nullable: false,
    })
    @Index('IDX_comment_type')
    type!: CommentType;

    @Column({
        type: 'text',
        nullable: false,
    })
    content!: string;

    @Column({
        type: 'enum',
        enum: CommentStatusEnum,
        default: CommentStatusEnum.PENDING,
        nullable: false,
    })
    status!: CommentStatus;  

    @Column({
        type: 'int',
        nullable: true,
        comment: 'Parent comment ID',
    })
    @Index('IDX_comment_parent_id')
    parent_id?: number | null;

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
        type: 'varchar',
        nullable: true,
        comment: 'Guest commenter name if not logged in',
    })
    guest_name?: string | null;

    @Column({
        type: 'varchar',
        nullable: true,
        comment: 'Guest commenter email',
    })
    guest_email?: string | null;

    @Column({
        type: 'varchar',
        nullable: true,
        comment: 'Guest commenter website',
    })
    guest_website?: string | null;

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
        comment: 'Verified buyer/poster',
    })
    is_verified!: boolean;

    @Column({
        type: 'boolean',
        default: false,
        comment: 'Staff/administrator comment',
    })
    is_staff!: boolean;

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
    @ManyToOne('CommentEntity', {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'parent_id' })
    parent?: CommentEntity;

    @ManyToOne('UserEntity', {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'user_id' })
    user?: UserEntity;
}
