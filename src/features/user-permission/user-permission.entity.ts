import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import type PermissionEntity from '@/features/permission/permission.entity';
import type UserEntity from '@/features/user/user.entity';

const ENTITY_TABLE_NAME = 'user_permission';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores user permissions',
})
@Index('IDX_user_permission_permission', ['user_id', 'permission_id'], {
	unique: true,
})
export default class UserPermissionEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@Column('int', { unsigned: false, nullable: false })
	user_id!: number;

	@Column('int', { unsigned: false, nullable: false })
	permission_id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@DeleteDateColumn({ type: 'timestamp', nullable: true, select: true })
	deleted_at!: Date | null;

	// RELATIONS
	@ManyToOne('UserEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity;

	@ManyToOne('PermissionEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'permission_id' })
	permission?: PermissionEntity;
}
