import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type PageMeta,
} from '@/shared/abstracts/entity.abstract';
import type CategoryEntity from './category.entity';
import { type CategoryType, CategoryTypeEnum } from './category.entity';

const ENTITY_TABLE_NAME = 'category_content';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Language-specific category content (slug, description, metadata)',
})
@Index(
	'IDX_category_content_category_id_language',
	['category_id', 'language'],
	{ unique: true },
)
@Index('IDX_category_content_slug_language', ['type', 'slug', 'language'], {
	unique: true,
})
export default class CategoryContentEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	category_id!: number;

	@Column('varchar', {
		length: 2,
		default: 'en',
	})
	language!: string;

	@Column({
		type: 'enum',
		enum: CategoryTypeEnum,
		nullable: false,
		select: false,
		comment:
			'The type is duplicated here from category to be used as unique index',
	})
	type!: CategoryType;

	@Column('varchar', { nullable: false })
	label!: string;

	@Column('varchar', { nullable: false })
	slug!: string;

	@Column('text', { nullable: true })
	description!: string | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'SEO metadata, canonical URL, images, structured data, etc.',
	})
	meta!: PageMeta | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	// RELATIONS
	@ManyToOne('CategoryEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'category_id' })
	category!: CategoryEntity;
}
