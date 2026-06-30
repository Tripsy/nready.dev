import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';
import type ProductEntity from './product.entity';

const ENTITY_TABLE_NAME = 'product_content';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Language-specific content for products (name, slug, descriptions, meta)',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_product_content_unique_per_lang', ['product_id', 'language'])
@Index('IDX_product_content_slug_lang', ['slug', 'language'], { unique: true })
export default class ProductContentEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	product_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('varchar', { nullable: false })
	label!: string;

	@Column('varchar', { nullable: false })
	slug!: string;

	@Column('text', { nullable: true })
	description!: string | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'SEO metadata for product pages.',
	})
	meta!: Record<string, number> | null;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;
}
