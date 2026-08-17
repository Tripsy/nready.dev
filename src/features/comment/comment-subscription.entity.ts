import {Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import type UserEntity from '@/features/user/user.entity';

const ENTITY_TABLE_NAME = 'rating';

@Entity({
    name: ENTITY_TABLE_NAME,
    schema: 'public',
})
export class CommentSubscriptionEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id!: number;

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    created_at!: Date;

    @Column('int', { nullable: false })
    @Index('IDX_comment_subscription_user_id')
    user_id!: number;

    @Column('varchar', { length: 50, nullable: false })
    entity_type!: string;

    @Column('int', { nullable: false })
    entity_id!: number;

    @Column({
        type: 'enum',
        enum: ['all', 'replies_to_me', 'mentions'],
        default: 'all',
    })
    notification_type!: string;

    @ManyToOne('UserEntity', {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user!: UserEntity;
}
