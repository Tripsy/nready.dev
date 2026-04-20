import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import {
	type LogDataLevel,
	LogDataLevelEnum,
} from '@/shared/types/log-data.type';

export const LogDataCategoryEnum = {
	SYSTEM: 'system',
	HISTORY: 'history',
	CRON: 'cron',
	INFO: 'info',
	ERROR: 'error',
} as const;

export type LogDataCategory =
	(typeof LogDataCategoryEnum)[keyof typeof LogDataCategoryEnum];

const ENTITY_TABLE_NAME = 'log_data';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'logs',
})
@Index('idx_log_data', ['created_at', 'level', 'category'])
export default class LogDataEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int', unsigned: false })
	id!: number;

	@Column('char', { length: 36, nullable: false })
	@Index('IDX_log_data_pid')
	pid!: string;

	@Column('varchar', { nullable: true })
	@Index('IDX_log_data_request_id')
	request_id!: string | null;

	@Column('varchar', { nullable: false })
	category!: string;

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
	debugStack?: Record<string, unknown>;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;
}
