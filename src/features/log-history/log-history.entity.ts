import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import type { RequestContextSource } from '@/config/request.context';
import type UserEntity from '@/features/user/user.entity';
import type { LogHistoryAction } from '@/shared/types/log-history.type';

const ENTITY_TABLE_NAME = 'log_history';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'logs',
	comment: 'Store entities history: created, updated, deleted, etc.',
})
@Index('IDX_log_history_entity_id_action', ['entity_id', 'entity', 'action'], {
	unique: false,
})
export default class LogHistoryEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int', unsigned: false })
	id!: number;

	@Column('varchar', { nullable: false })
	entity!: string;

	@Column({ type: 'int', nullable: false })
	entity_id!: number;

	@Column({ type: 'varchar', nullable: false })
	action!: LogHistoryAction;

	@Column({ type: 'int', nullable: true })
	@Index('IDX_log_history_auth_id', { unique: false })
	auth_id!: number | null;

	@Column({ type: 'varchar', nullable: false })
	@Index('IDX_log_history_performed_by', { unique: false })
	performed_by!: string;

	@Column({ type: 'varchar', nullable: false })
	@Index('IDX_log_history_request_id', { unique: false })
	request_id!: string;

	@Column({ type: 'varchar', nullable: false })
	@Index('IDX_log_history_source', { unique: false })
	source!: RequestContextSource;

	@Column({ type: 'timestamp', nullable: false })
	@Index('IDX_log_history_recorded_at', { unique: false })
	recorded_at!: Date;

	@Column({ type: 'jsonb', nullable: true, comment: 'Log data' })
	details?: Record<string, unknown>;

	// RELATIONS
	@ManyToOne('UserEntity', {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
	user?: UserEntity | null;
}
