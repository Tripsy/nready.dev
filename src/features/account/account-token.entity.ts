import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import type UserEntity from '@/features/user/user.entity';

const ENTITY_TABLE_NAME = 'account_token';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'system',
	comment: 'Stores `ident` for account tokens to manage token revocation',
})
export default class AccountTokenEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = false;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@Column('int', { unsigned: false, nullable: false })
	@Index('IDX_account_token_user_id')
	user_id!: number;

	@Column('char', { length: 36, nullable: false, unique: true })
	@Index('IDX_account_token_ident', { unique: true })
	ident!: string;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@Column({ type: 'json', nullable: true, comment: 'Fingerprinting data' })
	metadata?: Record<string, unknown>;

	@Column({ type: 'timestamp', nullable: true })
	used_at!: Date | null;

	@Column({ type: 'timestamp', nullable: false })
	expire_at!: Date;

	// RELATIONS
	@ManyToOne('UserEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity;
}
