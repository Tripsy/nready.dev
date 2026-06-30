import {
	Column,
	DeleteDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';

const ENTITY_TABLE_NAME = 'permission';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'system',
	comment: 'Stores permissions',
})
@Index('IDX_permission', ['entity', 'operation'], { unique: true })
export default class PermissionEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@Column('varchar', { nullable: false })
	entity!: string;

	@Column('varchar', { nullable: false })
	operation!: string;

	@DeleteDateColumn({ type: 'timestamp', nullable: true, select: true })
	deleted_at!: Date | null;
}
