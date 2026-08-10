import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import type ProductEntity from '@/features/product/product.entity';
import type ProductPriceEntity from '@/features/product/product-price.entity';
import type ProductVariantAttributeEntity from '@/features/product/product-variant-attribute.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'product_variant';

/**
 * The purchasable unit. A product is the thing in the catalog ("Margherita", "Oxford shirt"); a
 * variant is what a customer actually puts in the basket ("Margherita, large", "Oxford shirt, M,
 * blue") and what a price is attached to.
 *
 * **Every product carries at least one variant, even when nothing varies.** A single-variant
 * product is the normal case, not a special one — the alternative, prices hanging off both the
 * product and the variant, means two places to look for the answer and a rule about which wins.
 * The service layer creates the default variant alongside the product.
 *
 * What distinguishes one variant from another is recorded in `product_variant_attribute`, so the
 * axes are whatever the catalog needs rather than a fixed size/color pair.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'The purchasable unit of a product; prices and order lines reference this, not the product',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
// Reads are almost always "every variant of this product, in display order"
@Index('IDX_product_variant_product_id', ['product_id', 'position'])
// At most one default per product. Partial rather than a check constraint, because the rule is
// about the set of rows for a product, which a row-level check cannot see
@Index('IDX_product_variant_default', ['product_id'], {
	unique: true,
	where: 'is_default = true AND deleted_at IS NULL',
})
export default class ProductVariantEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	product_id!: number;

	@Column('varchar', {
		nullable: false,
		comment:
			'The code that is actually sold; `product.sku` is the style above it',
	})
	@Index('IDX_product_variant_sku', {
		unique: true,
		where: 'deleted_at IS NULL',
	})
	sku!: string;

	// Sits here rather than on the product: a barcode identifies one sellable unit, so two sizes
	// of the same item carry two different ones
	@Column('varchar', {
		nullable: true,
		comment: 'External identifier (EAN / UPC / GTIN)',
	})
	@Index('IDX_product_variant_barcode', {
		unique: true,
		where: 'barcode IS NOT NULL AND deleted_at IS NULL',
	})
	barcode!: string | null;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Display order within the product',
	})
	position!: number;

	@Column('boolean', {
		nullable: false,
		default: false,
		comment: 'The variant offered when the customer has not chosen one',
	})
	is_default!: boolean;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	@OneToMany(
		'ProductPriceEntity',
		(price: ProductPriceEntity) => price.variant,
	)
	prices?: ProductPriceEntity[];

	@OneToMany(
		'ProductVariantAttributeEntity',
		(attribute: ProductVariantAttributeEntity) => attribute.variant,
	)
	attributes?: ProductVariantAttributeEntity[];
}
