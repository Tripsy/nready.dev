import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { DiscountSnapshot } from '@/features/discount/discount.entity';
import type OrderEntity from '@/features/order/order.entity';
import type ProductEntity from '@/features/product/product.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

const ENTITY_TABLE_NAME = 'order_product';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores ordered products (order line items)',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
export default class OrderProductEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	@Index('IDX_order_product_order_id')
	order_id!: number;

	@Column('int', { nullable: false })
	@Index('IDX_order_product_product_id')
	product_id!: number;

	@Column('numeric', { precision: 12, scale: 2, nullable: false })
	quantity!: number;

	// COST RELATED
	@Column('decimal', { precision: 5, scale: 2, nullable: false })
	vat_rate!: number;

	@Column('decimal', { precision: 12, scale: 2, nullable: false })
	price!: number;

	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
		comment: 'Currency is specific to client',
	})
	currency!: string;

	@Column('decimal', {
		precision: 10,
		scale: 6,
		nullable: false,
		default: 1,
		comment:
			'Exchange rate to invoice base currency (default 1 = same currency)',
	})
	exchange_rate!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Array of discount snapshots applied',
	})
	discount?: DiscountSnapshot[];

	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('OrderEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'order_id' })
	order!: OrderEntity;

	@ManyToOne('ProductEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;
}
