import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type OrderProductEntity from '@/features/order/order-product.entity';
import type OrderShippingEntity from '@/features/order-shipping/order-shipping.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'order_shipping_product';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Allocation of ordered products to specific shipments',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index(
	'IDX_order_shipping_product_unique',
	['order_shipping_id', 'order_product_id'],
	{
		unique: true,
		where: 'deleted_at IS NULL',
	},
)
export default class OrderShippingProductEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	@Index('IDX_order_shipping_product_order_product_id')
	order_product_id!: number;

	@Column('int', { nullable: false })
	order_shipping_id!: number;

	@Column('numeric', { precision: 12, scale: 2, nullable: false })
	quantity!: number;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('OrderProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'order_product_id' })
	order_product!: OrderProductEntity;

	@ManyToOne('OrderShippingEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'order_shipping_id' })
	order_shipping!: OrderShippingEntity;
}
