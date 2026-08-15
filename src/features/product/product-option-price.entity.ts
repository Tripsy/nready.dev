import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductOptionEntity from '@/features/product/product-option.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';
import { numericTransformer } from '@/shared/transformers/numeric.transformer';

const ENTITY_TABLE_NAME = 'product_option_price';

/**
 * Per currency, like `product_price`, rather than a single amount on the option.
 *
 * A delta carries a currency whether or not a column says so: adding a `price_delta` of 3 to a
 * price quoted in EUR is only right if the 3 is EUR. Storing one figure for every market makes
 * that mismatch silent and wrong in the line total, which is the one place an error compounds.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Per-currency price delta for a product option; excludes VAT, like product-price.entity',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_product_option_price_unique', ['option_id', 'currency'], {
	unique: true,
	where: 'deleted_at IS NULL',
})
export default class ProductOptionPriceEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	option_id!: number;

	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
	})
	currency!: string;

	// No positivity check, unlike `product_price.price` — a discount for leaving something out is
	// a normal answer, so the delta is signed
	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: false,
		default: 0,
		comment: 'Added to the variant price; negative subtracts',
		transformer: numericTransformer,
	})
	price_delta!: number;

	// RELATIONS
	@ManyToOne('ProductOptionEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'option_id' })
	option!: ProductOptionEntity;
}
