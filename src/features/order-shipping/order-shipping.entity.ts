import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type CarrierEntity from '@/features/carrier/carrier.entity';
import type { DiscountSnapshot } from '@/features/discount/discount.entity';
import type OrderEntity from '@/features/order/order.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

export enum ShippingStatusEnum {
	PENDING = 'pending',
	PREPARING = 'preparing',
	SHIPPED = 'shipped',
	DELIVERED = 'delivered',
	FAILED = 'failed',
	RETURNED = 'returned',
}

const ENTITY_TABLE_NAME = 'order_shipping';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores shipping details for orders',
})
export default class OrderShippingEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	@Index('IDX_order_shipping_order_id')
	order_id!: number;

	@Column({
		type: 'enum',
		enum: ShippingStatusEnum,
		default: ShippingStatusEnum.PENDING,
		nullable: false,
	})
	@Index('IDX_order_shipping_status')
	status!: ShippingStatusEnum;

	@Column('varchar', {
		nullable: true,
		comment: 'eg: courier, pickup, same-day, own-fleet, etc',
	})
	@Index('IDX_order_shipping_method')
	method!: string | null;

	@Column('int', { nullable: true })
	@Index('IDX_order_shipping_carrier_id')
	carrier_id!: number | null;

	@Column('varchar', { nullable: true })
	@Index('IDX_order_shipping_tracking_number', { unique: true })
	tracking_number!: string | null;

	@Column('varchar', { nullable: true })
	tracking_url!: string | null;

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

	@Column('simple-json', {
		nullable: true,
		comment: 'Array of discount snapshots applied',
	})
	discount?: DiscountSnapshot[];

	// CONTACT DETAILS
	@Column('varchar', { nullable: true })
	contact_name!: string | null;

	@Column('varchar', { nullable: true })
	contact_phone!: string | null;

	@Column('varchar', { nullable: true })
	contact_email!: string | null;

	// ADDRESS SNAPSHOT
	@Column('varchar', { nullable: true })
	address_country!: string | null;

	@Column('varchar', { nullable: true })
	address_region!: string | null;

	@Column('varchar', { nullable: true })
	address_city!: string | null;

	@Column('varchar', { nullable: true })
	details!: string | null;

	@Column('varchar', { nullable: true })
	postal_code!: string | null;

	// DATES
	@Column({ type: 'timestamp', nullable: true })
	shipped_at!: Date | null;

	@Column({ type: 'timestamp', nullable: true })
	delivered_at!: Date | null;

	@Column({ type: 'timestamp', nullable: true })
	estimated_delivery_at!: Date | null;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('OrderEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'order_id' })
	order!: OrderEntity;

	@ManyToOne('CarrierEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'carrier_id' })
	carrier?: CarrierEntity | null;
}
