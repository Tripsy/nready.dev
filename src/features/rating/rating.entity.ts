import {Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import type UserEntity from '@/features/user/user.entity';

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
@Index('UQ_rating_user',  ['entity_type','entity_id','type','user_id'],      { unique: true, where: 'user_id IS NOT NULL' })
@Index('UQ_rating_guest', ['entity_type','entity_id','type','user_ip_hash'], { unique: true, where: 'user_id IS NULL' })
@Check(`(type = 'emoji') = (reaction IS NOT NULL)`)
@Check(`(type = 'emoji') = (value IS NULL)`)
@Check(`type <> 'like' OR value IN (-1, 1)`)
@Check(`type <> 'stars' OR value BETWEEN 1 AND 5`)
export default class RatingEntity {
    static readonly NAME: string = ENTITY_TABLE_NAME;
    static readonly HAS_CACHE: boolean = false;

    @PrimaryGeneratedColumn({ type: 'int' })
    id!: number;

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    created_at!: Date;

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
    @ManyToOne('UserEntity', {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'user_id' })
    user?: UserEntity;
}
