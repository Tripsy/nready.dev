import { Column, Entity, Index } from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import type { StatusTransitions } from '@/shared/types/common.type';
import { UserRoleEnum } from '@/shared/types/user-role.type';

export enum UserStatusEnum {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	PENDING = 'pending',
}

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<UserStatusEnum> = {
	[UserStatusEnum.ACTIVE]: [UserStatusEnum.INACTIVE],
	[UserStatusEnum.INACTIVE]: [UserStatusEnum.ACTIVE],
	[UserStatusEnum.PENDING]: [UserStatusEnum.ACTIVE, UserStatusEnum.INACTIVE],
};

export enum UserOperatorTypeEnum {
	SELLER = 'seller',
	PRODUCT_MANAGER = 'product_manager',
	CONTENT_EDITOR = 'content_editor',
}

const ENTITY_TABLE_NAME = 'user';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
})
export default class UserEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('varchar', { nullable: false })
	name!: string;

	@Column('varchar', { nullable: false })
	@Index('IDX_user_email', { unique: true })
	email!: string;

	@Column({ type: 'timestamp', nullable: true })
	email_verified_at!: Date | null;

	@Column('varchar', { nullable: false, select: false })
	password!: string;

	@Column({ type: 'timestamp', nullable: false })
	password_updated_at!: Date;

	@Column('varchar', { length: 3, nullable: false })
	language!: string;

	@Column({
		type: 'enum',
		enum: UserStatusEnum,
		default: UserStatusEnum.PENDING,
		nullable: false,
	})
	status!: UserStatusEnum;

	@Column({
		type: 'enum',
		enum: UserRoleEnum,
		default: UserRoleEnum.MEMBER,
		nullable: false,
	})
	role!: UserRoleEnum;

	@Column({
		type: 'enum',
		enum: UserOperatorTypeEnum,
		nullable: true,
		comment: 'Operator type; only relevant when role is OPERATOR',
	})
	operator_type!: UserOperatorTypeEnum | null;
}
