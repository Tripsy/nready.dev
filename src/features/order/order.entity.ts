import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import type ClientEntity from '@/features/client/client.entity';
import type OrderProductEntity from '@/features/order/order-product.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

export const OrderStatusEnum = {
	DRAFT: 'draft',
	PENDING: 'pending',
	CONFIRMED: 'confirmed',
	COMPLETED: 'completed',
	CANCELLED: 'canceled',
} as const;

export type OrderStatus =
	(typeof OrderStatusEnum)[keyof typeof OrderStatusEnum];

export const OrderTypeEnum = {
	STANDARD: 'standard',
	SUBSCRIPTION: 'subscription',
} as const;

export type OrderType = (typeof OrderTypeEnum)[keyof typeof OrderTypeEnum];

const ENTITY_TABLE_NAME = 'order';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores order information',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
// Series plus sequential number, matching `invoice` and `grn` — one numbering scheme across every
// document the business issues
@Index('IDX_order_ref', ['ref_code', 'ref_number'], {
	unique: true,
	where: 'deleted_at IS NULL',
})
export default class OrderEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	@Index('IDX_order_client_id')
	client_id!: number;

	@Column('varchar', {
		length: 10,
		nullable: false,
		comment: 'Series code allocated from document_series, e.g. ORD',
	})
	ref_code!: string;

	@Column('int', {
		nullable: false,
		comment: 'Sequential number within the series',
	})
	ref_number!: number;

	@Column({
		type: 'enum',
		enum: OrderStatusEnum,
		default: OrderStatusEnum.DRAFT,
		nullable: false,
	})
	@Index('IDX_order_status')
	status!: OrderStatus;

	@Column({
		type: 'enum',
		enum: OrderTypeEnum,
		default: OrderTypeEnum.STANDARD,
		nullable: false,
	})
	type!: OrderType;

	@Column({ type: 'timestamp', nullable: false })
	@Index('IDX_order_issued_at')
	issued_at!: Date;

	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('ClientEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'client_id' })
	client!: ClientEntity;

	@OneToMany(
		'OrderProductEntity',
		(orderProduct: OrderProductEntity) => orderProduct.order,
	)
	order_products?: OrderProductEntity[];
}
