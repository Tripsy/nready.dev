import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import type TermEntity from '@/features/term/term.entity';

export type TermContentType = {
	language: string;
	value: string;
};

const ENTITY_TABLE_NAME = 'term_content';

/**
 * Deliberately not `EntityAbstract`: this table has no `deleted_at`.
 * A translation is never deleted on its own — the only write is `saveContent`'s upsert — and
 * the row dies with its term through the FK cascade.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Language-specific wording for terms',
})
@Index('IDX_term_content_unique_per_lang', ['term_id', 'language'], {
	unique: true,
})
export default class TermContentEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@Column('int', { nullable: false })
	term_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('varchar', {
		length: 255,
		nullable: false,
		comment: 'Localized term value',
	})
	value!: string;

	// RELATIONS
	@ManyToOne('TermEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'term_id' })
	term!: TermEntity;
}
