import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductVariantEntity from '@/features/product/product-variant.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'product_price';

/**
 * Keyed on the variant, not the product: two sizes of one dish are two prices, and a product with
 * nothing to vary still reaches its price through its single default variant. One place to look.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Per-currency price set for a product variant; every value excludes VAT, matching the contract discounts are applied under',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_product_price_unique', ['variant_id', 'currency'], {
	unique: true,
	where: 'deleted_at IS NULL',
})
@Check(`(price > 0)`)
@Check(`(rrp IS NULL OR rrp > 0)`)
@Check(`(cost_price IS NULL OR cost_price >= 0)`)
@Check(`(min_price IS NULL OR min_price <= price)`)
export default class ProductPriceEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	variant_id!: number;

	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
	})
	currency!: string;

	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: false,
		comment: 'The selling price, per `product.unit`',
	})
	price!: number;

	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: true,
		comment:
			"Manufacturer's recommended retail price; display reference only, never charged",
	})
	rrp!: number | null;

	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: true,
		comment:
			'Acquisition price paid to the vendor; drives margin reporting',
	})
	cost_price!: number | null;

	// The discount engine stacks percentages and amounts, so without a floor a coupon on top of a
	// campaign can price below cost. Kept separate from `cost_price`: the floor is a commercial
	// decision, the cost is an accounting fact
	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: true,
		comment: 'Lowest price a discount may resolve to',
	})
	min_price!: number | null;

	// RELATIONS
	@ManyToOne('ProductVariantEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'variant_id' })
	variant!: ProductVariantEntity;
}
