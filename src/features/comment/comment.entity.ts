import {
    Column, CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import type UserEntity from '@/features/user/user.entity';

export const CommentStatusEnum = {
    PENDING: 'pending',           // Awaiting moderation
    REJECTED: 'rejected',        // Rejected by moderator
    APPROVED: 'approved',         // Visible to public
    SPAM: 'spam',                // Marked as spam
    FLAGGED: 'flagged',          // Reported by users
} as const;

export type CommentStatus =
    (typeof CommentStatusEnum)[keyof typeof CommentStatusEnum];

export const CommentTypeEnum = {
    COMMENT: 'comment',           // Regular comment
    REVIEW: 'review',            // Product review with rating
    QUESTION: 'question',        // Question
    ANSWER: 'answer',            // Answer to question
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
@Index('IDX_comment_entity', ['entity_type', 'entity_id'])
@Index('IDX_comment_status_created', ['status', 'created_at'])
@Index('IDX_comment_user_status', ['user_id', 'status'])
@Index('IDX_comment_user_status', ['recorded_ip_hash', 'status'])
export default class CommentEntity {
    static readonly NAME: string = ENTITY_TABLE_NAME;
    static readonly HAS_CACHE: boolean = true;

    @PrimaryGeneratedColumn({ type: 'int' })
    id!: number;

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp', nullable: true })
    updated_at!: Date | null;

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
    @Index('IDX_comment_status')
    status!: CommentStatus;

    @Column({
        type: 'enum',
        enum: CommentTypeEnum,
        default: CommentTypeEnum.COMMENT,
        nullable: false,
    })
    @Index('IDX_comment_type')
    type!: CommentType;

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

    @Column({
        type: 'int',
        nullable: true,
        comment: 'Parent comment ID',
    })
    @Index('IDX_comment_parent_id')
    parent_id?: number | null;

    // User Information
    @Column({
        type: 'int',
        nullable: true,
    })
    @Index('IDX_comment_user_id')
    user_id?: number | null;

    @Column({
        type: 'varchar',
        nullable: true,
        comment: 'Recorded IP address (hashed for privacy)',
    })
    recorded_ip_hash!: string;

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

    // Relations
    @ManyToOne('UserEntity', {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'user_id' })
    user?: UserEntity;
}
