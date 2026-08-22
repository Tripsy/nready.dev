import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductVariantEntity from '@/features/product/product-variant.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';
import { numericTransformer } from '@/shared/transformers/numeric.transformer';

const ENTITY_TABLE_NAME = 'product_price';

/**
 * Keyed on the variant, not the product: two sizes of one dish are two prices, and a product with
 * nothing to vary still reaches its price through its single default variant. One place to look.
 *
 * **Sales side only.** Every figure here is what a customer is quoted in one market, set rather
 * than converted. What the goods cost is a single base-currency number on
 * `product_variant.cost_price`, because the books are kept in one currency and margin is settled
 * there — `order_product.exchange_rate` brings the sale back to base to meet it.
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
		transformer: numericTransformer,
	})
	price!: number;

	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: true,
		comment:
			"Manufacturer's recommended retail price; display reference only, never charged",
		transformer: numericTransformer,
	})
	rrp!: number | null;

	// The discount engine stacks percentages and amounts, so without a floor a coupon on top of a
	// campaign can price below cost. A commercial decision set per market, not a computed one —
	// the cost it protects lives in base currency on `product_variant.cost_price`
	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: true,
		comment: 'Lowest price a discount may resolve to',
		transformer: numericTransformer,
	})
	min_price!: number | null;

	// RELATIONS
	@ManyToOne('ProductVariantEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'variant_id' })
	variant!: ProductVariantEntity;
}
