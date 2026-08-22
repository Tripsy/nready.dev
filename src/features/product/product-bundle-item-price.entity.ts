import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductBundleItemEntity from '@/features/product/product-bundle-item.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';
import { numericTransformer } from '@/shared/transformers/numeric.transformer';

const ENTITY_TABLE_NAME = 'product_bundle_item_price';

/**
 * What choosing this component does to the bundle price — the "+5 for sweet potato fries" of a
 * combo. Per currency, and signed, for the same reasons as `product_option_price`: a delta carries
 * a currency whether or not a column says so, and declining something may legitimately reduce the
 * price.
 *
 * Nothing to do with the component's own `product_price`. That is its standalone price, used to
 * apportion the bundle total across VAT rates; this is what the customer pays extra to pick it.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Per-currency price delta for choosing a bundle component; excludes VAT',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_product_bundle_item_price_unique', ['item_id', 'currency'], {
	unique: true,
	where: 'deleted_at IS NULL',
})
export default class ProductBundleItemPriceEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	item_id!: number;

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
		default: 0,
		comment: 'Added to the bundle price; negative subtracts',
		transformer: numericTransformer,
	})
	price_delta!: number;

	// RELATIONS
	@ManyToOne('ProductBundleItemEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'item_id' })
	item!: ProductBundleItemEntity;
}
