import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { ClientTypeEnum } from '@/features/client/client.entity';
import type { DiscountSnapshot } from '@/features/discount/discount.entity';
import type OrderEntity from '@/features/order/order.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

export enum InvoiceStatusEnum {
	DRAFT = 'draft', // Initial state, not sent to customer
	ISSUED = 'issued', // Invoice issued to customer
	PAID = 'paid', // Payment received in full
	OVERDUE = 'overdue', // Past due date, payment not received
	CANCELLED = 'cancelled', // Invoice invalidated
	REFUNDED = 'refunded', // Payment returned to the customer
}

export enum InvoiceTypeEnum {
	CHARGE = 'charge',
	PROFORMA = 'proforma',
	CREDIT_NOTE = 'credit_note', // Reduces the amount the buyer owes from a previous order
}

export type BillingDetailsPerson = {
	type: ClientTypeEnum.PERSON;

	// Person
	person_name: string;
	person_cnp?: string | null;

	// Financial
	iban?: string | null;
	bank_name?: string | null;

	// Address
	address_country: string;
	address_region?: string | null;
	address_city?: string | null;
	address_info?: string | null;
	address_postal_code?: string | null;

	// Contact
	contact_name?: string | null;
	contact_email?: string | null;
	contact_phone?: string | null;
};

export type BillingDetailsCompany = {
	type: ClientTypeEnum.COMPANY;

	// Company
	company_name: string;
	company_cui?: string | null;
	company_reg_com?: string | null;

	// Financial
	iban?: string | null;
	bank_name?: string | null;

	// Address
	address_country: string;
	address_region?: string | null;
	address_city?: string | null;
	address_info?: string | null;
	address_postal_code?: string | null;

	// Contact
	contact_name?: string | null;
	contact_email?: string | null;
	contact_phone?: string | null;
};

// TODO should contain payment_id

export type BillingDetails = BillingDetailsPerson | BillingDetailsCompany;

const ENTITY_TABLE_NAME = 'invoice';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores invoices generated from orders',
})
@Index('IDX_invoice_ref', ['ref_number', 'ref_code'], {
	unique: true,
})
export default class InvoiceEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	@Index('IDX_invoice_order_id')
	order_id!: number;

	@Column('varchar', {
		length: 3,
		nullable: false,
		comment: 'Invoice series/code, e.g., ABC',
	})
	ref_code!: string;

	@Column('int', {
		nullable: false,
		comment: 'Sequential invoice number within the series',
	})
	ref_number!: number;

	@Column({
		type: 'enum',
		enum: InvoiceStatusEnum,
		default: InvoiceStatusEnum.DRAFT,
		nullable: false,
	})
	@Index('IDX_invoice_status')
	status!: InvoiceStatusEnum;

	@Column({
		type: 'enum',
		enum: InvoiceTypeEnum,
		default: InvoiceTypeEnum.CHARGE,
		nullable: false,
	})
	@Index('IDX_invoice_type')
	type!: InvoiceTypeEnum;

	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
		comment: 'Base currency for the invoice',
	})
	base_currency!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Array of discount snapshots applied',
	})
	discount?: DiscountSnapshot[];

	@Column({ type: 'timestamp', nullable: false })
	issued_at!: Date;

	@Column({ type: 'timestamp', nullable: true })
	due_at!: Date | null;

	@Column({ type: 'timestamp', nullable: true })
	paid_at!: Date | null;

	@Column('jsonb', {
		nullable: true,
		comment:
			'Snapshot of billing info at the moment of issuing the invoice',
	})
	billing_details!: BillingDetails;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('OrderEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'order_id' })
	order!: OrderEntity;
}
