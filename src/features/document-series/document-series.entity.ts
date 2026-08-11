import {
	Check,
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

/**
 * The documents that carry a human-facing reference. One series per document type, so this is
 * also what an allocation resolves on.
 */
export const DocumentTypeEnum = {
	INVOICE: 'invoice',
	ORDER: 'order',
	GRN: 'grn',
	SUBSCRIPTION: 'subscription',
} as const;

export type DocumentType =
	(typeof DocumentTypeEnum)[keyof typeof DocumentTypeEnum];

/**
 * A series that never resets stores this instead of a calendar year. Kept as a sentinel rather
 * than a nullable column so the unique key stays a plain two-column index — in Postgres a NULL
 * `year` would let the same `document_type` be inserted twice.
 */
export const YEAR_CONTINUOUS = 0;

/**
 * Placeholders understood by `format`. `{number}` arrives already padded; `{year}` renders empty
 * for a continuous series, which is why a format meant for both shapes should not hard-code a
 * separator around it.
 */
export const REFERENCE_PLACEHOLDERS = ['{code}', '{year}', '{number}'] as const;

const ENTITY_TABLE_NAME = 'document_series';

/**
 * Numbering series and their counters.
 *
 * **No `deleted_at`**, so this does not extend `EntityAbstract`. `RepositoryAbstract` soft-deletes
 * by default and every query filters `deleted_at IS NULL`, which for a counter means the row
 * holding the last issued number quietly disappears while its `(document_type, year)` key stays
 * taken — an allocation would then fail rather than continue. A series that is finished is simply
 * left alone; deleting one is a hard delete and only safe before it has issued anything.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Document numbering series and their counters',
})
@Index('IDX_document_series_key', ['document_type', 'year'], {
	unique: true,
})
@Check(`("year" = 0 OR "year" BETWEEN 2000 AND 2100)`)
@Check(`("start_number" > 0 AND "next_number" > 0)`)
@Check(`("padding" BETWEEN 0 AND 12)`)
export default class DocumentSeriesEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@Column({
		type: 'enum',
		enum: DocumentTypeEnum,
		nullable: false,
	})
	document_type!: DocumentType;

	@Column('varchar', {
		length: 10,
		nullable: false,
		comment: 'Series prefix, e.g. INV',
	})
	code!: string;

	@Column('smallint', {
		nullable: false,
		default: YEAR_CONTINUOUS,
		comment:
			'Calendar year the counter belongs to; 0 = series never resets',
	})
	year!: number;

	@Column('int', {
		nullable: false,
		default: 1,
		comment: 'First number of the series; a yearly rollover resets to it',
	})
	start_number!: number;

	@Column('int', {
		nullable: false,
		default: 1,
		comment: 'Number handed out by the next allocation',
	})
	next_number!: number;

	@Column('smallint', {
		nullable: false,
		default: 0,
		comment: 'Zero-padding width applied to {number}; 0 = no padding',
	})
	padding!: number;

	@Column('varchar', {
		nullable: false,
		default: '{code}-{number}',
		comment: 'Reference template, placeholders {code} {year} {number}',
	})
	format!: string;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;
}
