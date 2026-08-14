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
import type BrandEntity from '@/features/brand/brand.entity';
import type { PageMeta } from '@/shared/abstracts/entity.abstract';

export type BrandContentType = {
	language: string;
	description?: string;
	meta: PageMeta;
};

const ENTITY_TABLE_NAME = 'brand_content';

/**
 * Deliberately not `EntityAbstract`: this table has no `deleted_at`.
 * A translation is never deleted on its own — the only write is `saveContent`'s upsert — and
 * the row dies with its brand through the FK cascade.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Language-specific content for brands (descriptions, meta)',
})
@Index('IDX_brand_content_unique_per_lang', ['brand_id', 'language'], {
	unique: true,
})
export default class BrandContentEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@Column('int', { nullable: false })
	brand_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('text', { nullable: true })
	description!: string | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'SEO metadata, canonical URL, images, structured data, etc.',
	})
	meta!: PageMeta | null;

	// RELATIONS
	@ManyToOne('BrandEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'brand_id' })
	brand!: BrandEntity;
}
