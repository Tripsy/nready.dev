import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type DiscountEntity from '@/features/discount/discount.entity';
import type ProductEntity from '@/features/product/product.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'product_discount';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Links products to discounts with `product` scope; the window and the rules stay on the discount itself',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_product_discount_unique', ['product_id', 'discount_id'], {
	unique: true,
	where: 'deleted_at IS NULL',
})
export default class ProductDiscountEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	product_id!: number;

	@Column('int', { nullable: false })
	@Index('IDX_product_discount_discount_id')
	discount_id!: number;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	// CASCADE: the link has no meaning once the discount is gone, and a discount already applied to
	// an order survives as a snapshot on the order line rather than through this row
	@ManyToOne('DiscountEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'discount_id' })
	discount!: DiscountEntity;
}
