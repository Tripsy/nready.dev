import {
	Check,
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

export const CURRENCY_DEFAULT = 'RON';

export enum CurrencyEnum {
	RON = 'RON',
	EUR = 'EUR',
	USD = 'USD',
}

export enum CashFlowDirectionEnum { // relative to company
	IN = 'in', // money received
	OUT = 'out', // money sent
}

export enum CashFlowCategoryTypeEnum {
	REVENUE = 'revenue',
	EXPENSE = 'expense',
	CORRECTION = 'correction',
}

export enum CashFlowCategoryEnum {
	// Revenue
	CUSTOMER = 'customer', // When company receive money from customer (invoice based)

	// Operational Expenses
	FUEL = 'fuel', // Vehicle fuel
	MAINTENANCE = 'maintenance', // Vehicle repairs
	TOLLS = 'tolls', // Road tolls

	// Personnel
	EMPLOYEE_SALARY = 'employee_salary',

	// Business Expenses
	VENDOR = 'vendor', // Third-party services
	INSURANCE = 'insurance',
	TAXES = 'taxes',

	// Correction
	CORRECTION = 'correction',
	REFUND = 'refund',
	EMPLOYEE_REIMBURSEMENT = 'employee_reimbursement',
}

export const getExpectedCategoryType = (
	category: CashFlowCategoryEnum,
): CashFlowCategoryTypeEnum => {
	const revenueCategories = [CashFlowCategoryEnum.CUSTOMER];
	const expenseCategories = [
		CashFlowCategoryEnum.FUEL,
		CashFlowCategoryEnum.MAINTENANCE,
		CashFlowCategoryEnum.TOLLS,
		CashFlowCategoryEnum.EMPLOYEE_SALARY,
		CashFlowCategoryEnum.VENDOR,
		CashFlowCategoryEnum.INSURANCE,
		CashFlowCategoryEnum.TAXES,
	];
	const correctionCategories = [
		CashFlowCategoryEnum.CORRECTION,
		CashFlowCategoryEnum.REFUND,
		CashFlowCategoryEnum.EMPLOYEE_REIMBURSEMENT,
	];

	if (revenueCategories.includes(category)) {
		return CashFlowCategoryTypeEnum.REVENUE;
	}

	if (expenseCategories.includes(category)) {
		return CashFlowCategoryTypeEnum.EXPENSE;
	}

	if (correctionCategories.includes(category)) {
		return CashFlowCategoryTypeEnum.CORRECTION;
	}

	throw new Error(`Unknown category: ${category}`);
};

export const getExpectedDirection = (
	categoryType: CashFlowCategoryTypeEnum,
): CashFlowDirectionEnum | null => {
	switch (categoryType) {
		case CashFlowCategoryTypeEnum.REVENUE:
			return CashFlowDirectionEnum.IN;
		case CashFlowCategoryTypeEnum.EXPENSE:
			return CashFlowDirectionEnum.OUT;
		case CashFlowCategoryTypeEnum.CORRECTION:
			// Correction can be both, so no specific direction
			return null;
	}
};

export enum CashFlowStatusEnum {
	PENDING = 'pending', // Created, waiting for gateway or user redirect
	AUTHORIZED = 'authorized', // CashFlow authorized but not captured
	COMPLETED = 'completed', // Money captured
	FAILED = 'failed',
	REFUNDED = 'refunded',
	PARTIALLY_REFUNDED = 'partially_refunded',
	CANCELED = 'canceled', // User canceled before completion
	EXPIRED = 'expired', // Authorization expired
	REQUIRES_ACTION = 'requires_action', // 3D Secure, etc.
}

// Only entries with specified statuses are available for update
export const MUTABLE_STATUSES = [
	CashFlowStatusEnum.PENDING,
	CashFlowStatusEnum.AUTHORIZED,
	CashFlowStatusEnum.REQUIRES_ACTION
];

// Only entries with specified statuses are eligible for refund
export const REFUNDABLE_STATUSES = [
	CashFlowStatusEnum.COMPLETED,
	CashFlowStatusEnum.REFUNDED, // This means has been totally refunded so status listed here is somewhat redundant, but it allows clear error reporting with amount available for refund
	CashFlowStatusEnum.PARTIALLY_REFUNDED
];

export enum CashFlowGatewayEnum {
	DIRECT = 'direct',
	STRIPE = 'stripe',
	PAYPAL = 'paypal',
}

export enum CashFlowMethodEnum {
	// Card methods
	CREDIT_CARD = 'credit_card',
	DEBIT_CARD = 'debit_card',

	// Digital wallets
	PAYPAL = 'paypal',

	// Traditional
	CASH = 'cash',
	BANK_TRANSFER = 'bank_transfer',
	CHECK = 'check',

	// Other
	CRYPTO = 'crypto',
	GIFT_CARD = 'gift_card',
}

const ENTITY_TABLE_NAME = 'cash_flow';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Tracks cash flows.',
})
@Index('IDX_cash_flow_created_at', ['created_at'])
@Index('IDX_cash_flow_category_type_created_at', [
	'category_type',
	'created_at',
])
@Index('IDX_cash_flow_category_created_at', ['category', 'created_at'])
@Index('IDX_cash_flow_gateway_status', ['gateway', 'status'])
@Index('IDX_cash_flow_gateway_transaction_id', ['gateway', 'transaction_id'], {
	unique: true,
})
@Index('IDX_cash_flow_method_status', ['method', 'status'])
@Index('IDX_cash_flow_status_created_at', ['status', 'created_at'])
@Check(`
  (
    -- Direction + amount consistency for originals
    (parent_id IS NULL AND 
      ((category_type = 'revenue' AND direction = 'in') OR
       (category_type = 'expense' AND direction = 'out'))
    )

    -- Refunds / corrections
    OR (parent_id IS NOT NULL AND category_type = 'correction')
  )
`)
@Check(`(amount > 0)`)
export default class CashFlowEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column({
		type: 'enum',
		enum: CashFlowDirectionEnum,
		default: CashFlowDirectionEnum.IN,
		nullable: false,
	})
	direction!: CashFlowDirectionEnum;

	@Column({
		type: 'enum',
		enum: CashFlowCategoryTypeEnum,
		default: CashFlowCategoryTypeEnum.REVENUE,
		nullable: false,
	})
	category_type!: CashFlowCategoryTypeEnum;

	@Column({
		type: 'enum',
		enum: CashFlowCategoryEnum,
		default: CashFlowCategoryEnum.CUSTOMER,
		nullable: false,
	})
	category!: CashFlowCategoryEnum;

	@Column({
		type: 'enum',
		enum: CashFlowGatewayEnum,
		default: CashFlowGatewayEnum.DIRECT,
		nullable: false,
	})
	gateway!: CashFlowGatewayEnum;

	@Column({
		type: 'enum',
		enum: CashFlowMethodEnum,
		default: CashFlowMethodEnum.CASH,
		nullable: false,
	})
	method!: CashFlowMethodEnum;

	@Column({
		type: 'enum',
		enum: CashFlowStatusEnum,
		default: CashFlowStatusEnum.PENDING,
		nullable: false,
	})
	status!: CashFlowStatusEnum;

	@Column('int', {
		nullable: false,
		comment:
			'Amount intended to be charged; Note: It store cents; always divide by 100 for value',
	})
	amount!: number;

	@Column('decimal', { precision: 5, scale: 2, nullable: false })
	vat_rate!: number;

	@Column({
		type: 'enum',
		enum: CurrencyEnum,
		default: CURRENCY_DEFAULT,
		nullable: false,
	})
	currency!: CurrencyEnum;

	@Column('decimal', {
		precision: 10,
		scale: 6,
		nullable: false,
		default: 1,
		comment:
			'Exchange rate to invoice base currency (default 1 = default currency)',
	})
	exchange_rate!: number;

	// TRACKING
	@Column('varchar', { nullable: true })
	@Index('IDX_cash_flow_external_reference')
	external_reference!: string | null;

	@Column('int', {
		nullable: true,
		comment: 'Parent payment ID (e.g.: for refunds)',
	})
	@Index('IDX_parent_id')
	parent_id!: number | null;

	// GATEWAY ( // TODO in the future move this to a separate entity)
	@Column('varchar', {
		nullable: true,
		comment: 'Gateway transaction ID (e.g., Stripe charge id)',
	})
	transaction_id!: string | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Full gateway response snapshot for debugging/audit',
	})
	gateway_response!: Record<string, unknown> | null;

	@Column('text', { nullable: true })
	fail_reason!: string | null;

	// DATES
	@Column({ type: 'timestamp', nullable: true })
	captured_at!: Date | null;

	@Column({ type: 'timestamp', nullable: true })
	authorized_at!: Date | null;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@OneToMany(
		'CashFlowEntity',
		(cashFlow: CashFlowEntity) => cashFlow.parent_id,
	)
	refunds!: CashFlowEntity[];

	@ManyToOne(
		() => CashFlowEntity,
		(cashFlow) => cashFlow.refunds,
		{
			nullable: true,
			onDelete: 'SET NULL',
		},
	)
	@JoinColumn({ name: 'parent_id' })
	parent_refunds!: CashFlowEntity | null;
}
