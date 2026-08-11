import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductVariantEntity from '@/features/product/product-variant.entity';
import type TermEntity from '@/features/term/term.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'product_variant_attribute';

/**
 * What distinguishes one variant from its siblings — size `large`, color `blue`. Same term-based
 * shape as `product_attribute`, with one deliberate difference: the unique key stops at the label,
 * so a variant holds exactly one value per axis. A product may legitimately list three allergens
 * under the same label; a variant cannot be both `large` and `small`.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'The axis values that define a variant, using multilingual terms',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index(
	'IDX_product_variant_attribute_unique',
	['variant_id', 'attribute_label_id'],
	{
		unique: true,
		where: 'deleted_at IS NULL',
	},
)
export default class ProductVariantAttributeEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	// No index of its own: leftmost column of `IDX_product_variant_attribute_unique`
	@Column('int', { nullable: false })
	variant_id!: number;

	// Both indexed for the cascade `term` triggers on delete — Postgres looks the children up by
	// each key separately, and the value is not a prefix of the unique index
	@Column('int', { nullable: false })
	@Index('IDX_product_variant_attribute_label_id')
	attribute_label_id!: number;

	@Column('int', { nullable: false })
	@Index('IDX_product_variant_attribute_value_id')
	attribute_value_id!: number;

	// RELATIONS
	@ManyToOne('ProductVariantEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'variant_id' })
	variant!: ProductVariantEntity;

	@ManyToOne('TermEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'attribute_label_id' })
	attribute_label!: TermEntity;

	@ManyToOne('TermEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'attribute_value_id' })
	attribute_value!: TermEntity;
}
