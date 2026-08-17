import {Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';
import {CommentEntityType, CommentEntityTypeEnum} from "@/features/comment/comment.entity";

export const CommentSubscriptionTypeEnum = {
    ALL: 'all', // Notified on all comments
    REPLIES_TO_ME: 'replies_to_me',  // Notified on his own comment reply
    MENTIONS: 'mentions',  // Notified when mentioned
    UNSUBSCRIBED: 'unsubscribed', // Unsubscribed from notifications
} as const;

export type CommentSubscriptionType =
    (typeof CommentSubscriptionTypeEnum)[keyof typeof CommentSubscriptionTypeEnum];

const ENTITY_TABLE_NAME = 'comment_subscription';

@Entity({
    name: ENTITY_TABLE_NAME,
    schema: 'public',
})
@Index('UQ_comment_subscription_user', ['entity_type', 'entity_id', 'user_email'], { unique: true })
export default class CommentSubscriptionEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id!: number;

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    created_at!: Date;

    @Column({
        type: 'int',
        nullable: true,
    })
    user_id?: number | null;

    @Column({
        type: 'varchar',
    })
    user_name!: string;

    @Column({
        type: 'varchar',
    })
    user_email!: string;

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
        enum: CommentSubscriptionTypeEnum,
        default: CommentSubscriptionTypeEnum.ALL,
    })
    notification_type!: CommentSubscriptionType;
}
