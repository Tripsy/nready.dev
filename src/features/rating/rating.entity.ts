import {Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import type UserEntity from '@/features/user/user.entity';

export const RatingTypeEnum = {
    LIKE: 'like', // Rating value will be 1 or -1
    STARS: 'stars', // Rating value will be 1-5
    EMOJI: 'emoji', // TODO: Should i save in the value column or have a separate column?
} as const;

export type RatingType =
    (typeof RatingTypeEnum)[keyof typeof RatingTypeEnum];

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

@Entity({
    name: ENTITY_TABLE_NAME,
    schema: 'public',
})
export class RatingEntity {
    static readonly NAME: string = ENTITY_TABLE_NAME;
    static readonly HAS_CACHE: boolean = false;

    @PrimaryGeneratedColumn({ type: 'int' })
    id!: number;

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    created_at!: Date;

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
    @Index('IDX_comment_vote_user_id')
    user_id!: number;

    @Column({
        type: 'varchar',
        nullable: true,
        comment: 'Recorded IP address (hashed for privacy)',
    })
    recorded_ip_hash!: string;

    @Column({
        type: 'enum',
        enum: RatingTypeEnum,
        nullable: false,
    })
    type!: RatingType;

    @Column({
        type: 'int',
        nullable: true,
    })
    value!: number;

    // TODO: is this okay user can place multiple ratings but not on the same entry
    @ManyToOne('UserEntity', {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user!: UserEntity;
}
