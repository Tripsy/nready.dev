import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import {
	type LogDataCategory,
	LogDataCategoryEnum,
	type LogDataLevel,
	LogDataLevelEnum,
} from '@/shared/types/log-data.type';

const ENTITY_TABLE_NAME = 'log_data';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'logs',
})
/*
 * Equality columns lead, the range column trails: `findByFilter` filters `level` and
 * `category` by equality but `created_at` by range, and a btree stops filtering at the
 * first range predicate — anything ordered after `created_at` could never be used.
 */
@Index('IDX_log_data', ['level', 'category', 'created_at'])
export default class LogDataEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@Column('char', { length: 36, nullable: false })
	@Index('IDX_log_data_pid')
	pid!: string;

	@Column('varchar', { nullable: true })
	@Index('IDX_log_data_request_id')
	request_id!: string | null;

	@Column({
		type: 'enum',
		enum: LogDataCategoryEnum,
		nullable: false,
	})
	category!: LogDataCategory;

	@Column({
		type: 'enum',
		enum: LogDataLevelEnum,
		nullable: false,
	})
	level!: LogDataLevel;

	@Column('text')
	message?: string;

	@Column('simple-json', { nullable: true })
	context?: Record<string, unknown>;

	@Column('simple-json', { nullable: true })
	debug_stack?: Record<string, unknown>;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;
}
