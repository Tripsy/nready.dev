import {
	Check,
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import { arrayHasValue } from '@/helpers';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import type { StatusTransitions } from '@/shared/types/common.type';

export const CurrencyEnum = {
	RON: 'RON',
	EUR: 'EUR',
	USD: 'USD',
} as const;

export type Currency = (typeof CurrencyEnum)[keyof typeof CurrencyEnum];

export const CURRENCY_DEFAULT = CurrencyEnum.RON;

export const CashFlowDirectionEnum = {
	IN: 'in', // money received relative to company
	OUT: 'out', // money sent relative to company
} as const;

export type CashFlowDirection =
	(typeof CashFlowDirectionEnum)[keyof typeof CashFlowDirectionEnum];

export const CashFlowCategoryTypeEnum = {
	REVENUE: 'revenue',
	EXPENSE: 'expense',
	CORRECTION: 'correction',
} as const;

export type CashFlowCategoryType =
	(typeof CashFlowCategoryTypeEnum)[keyof typeof CashFlowCategoryTypeEnum];

export const CashFlowCategoryEnum = {
	// Revenue
	CUSTOMER: 'customer', // When company receive money from customer (invoice based)

	// Operational Expenses
	FUEL: 'fuel', // Vehicle fuel
	MAINTENANCE: 'maintenance', // Vehicle repairs
	TOLLS: 'tolls', // Road tolls

	// Personnel
	EMPLOYEE_SALARY: 'employee_salary',

	// Business Expenses
	VENDOR: 'vendor', // Third-party services
	INSURANCE: 'insurance',
	TAXES: 'taxes',

	// Correction
	CORRECTION: 'correction',
	REFUND: 'refund',
	EMPLOYEE_REIMBURSEMENT: 'employee_reimbursement',
} as const;

export type CashFlowCategory =
	(typeof CashFlowCategoryEnum)[keyof typeof CashFlowCategoryEnum];

export const getExpectedCategoryType = (
	category: CashFlowCategory,
): CashFlowCategoryType => {
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

	if (arrayHasValue(category, revenueCategories)) {
		return CashFlowCategoryTypeEnum.REVENUE;
	}

	if (arrayHasValue(category, expenseCategories)) {
		return CashFlowCategoryTypeEnum.EXPENSE;
	}

	if (arrayHasValue(category, correctionCategories)) {
		return CashFlowCategoryTypeEnum.CORRECTION;
	}

	throw new Error(`Unknown category: ${category}`);
};

export const getExpectedDirection = (
	categoryType: CashFlowCategoryType,
): CashFlowDirection | null => {
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

export const CashFlowStatusEnum = {
	PENDING: 'pending', // Created, waiting for gateway or user redirect
	AUTHORIZED: 'authorized', // CashFlow authorized but not captured
	COMPLETED: 'completed', // Money captured
	FAILED: 'failed',
	CANCELED: 'canceled', // User canceled before completion
	EXPIRED: 'expired', // Authorization expired
	REQUIRES_ACTION: 'requires_action', // 3D Secure, etc.
} as const;

export type CashFlowStatus =
	(typeof CashFlowStatusEnum)[keyof typeof CashFlowStatusEnum];

// Only entries with specified statuses are available for update
export const MUTABLE_STATUSES = [
	CashFlowStatusEnum.PENDING,
	CashFlowStatusEnum.AUTHORIZED,
	CashFlowStatusEnum.REQUIRES_ACTION,
];

// Only entries with specified statuses are eligible for refund
export const REFUNDABLE_STATUSES = [CashFlowStatusEnum.COMPLETED];

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<CashFlowStatus> = {
	[CashFlowStatusEnum.PENDING]: [
		CashFlowStatusEnum.AUTHORIZED,
		CashFlowStatusEnum.COMPLETED,
		CashFlowStatusEnum.FAILED,
		CashFlowStatusEnum.CANCELED,
		CashFlowStatusEnum.EXPIRED,
		CashFlowStatusEnum.REQUIRES_ACTION,
	],

	[CashFlowStatusEnum.AUTHORIZED]: [
		CashFlowStatusEnum.COMPLETED,
		CashFlowStatusEnum.CANCELED,
		CashFlowStatusEnum.EXPIRED,
	],

	[CashFlowStatusEnum.REQUIRES_ACTION]: [
		CashFlowStatusEnum.AUTHORIZED,
		CashFlowStatusEnum.FAILED,
		CashFlowStatusEnum.CANCELED,
	],

	[CashFlowStatusEnum.COMPLETED]: [
		// maybe allow nothing
	],

	[CashFlowStatusEnum.FAILED]: [],
	[CashFlowStatusEnum.CANCELED]: [],
	[CashFlowStatusEnum.EXPIRED]: [],
};

export const CashFlowGatewayEnum = {
	DIRECT: 'direct',
	STRIPE: 'stripe',
	PAYPAL: 'paypal',
} as const;

export type CashFlowGateway =
	(typeof CashFlowGatewayEnum)[keyof typeof CashFlowGatewayEnum];

export const CashFlowMethodEnum = {
	// Card methods
	CREDIT_CARD: 'credit_card',
	DEBIT_CARD: 'debit_card',

	// Digital wallets
	PAYPAL: 'paypal',

	// Traditional
	CASH: 'cash',
	BANK_TRANSFER: 'bank_transfer',
	CHECK: 'check',

	// // Other
	CRYPTO: 'crypto',
	GIFT_CARD: 'gift_card',
} as const;

export type CashFlowMethod =
	(typeof CashFlowMethodEnum)[keyof typeof CashFlowMethodEnum];

/**
 * Hard-rules:
 * 	- Only MUTABLE_STATUSES can be updated (therefore REFUND, PARTIALLY_UPDATED cannot be updated)
 * 	- Only REFUNDABLE_STATUSES are available for REFUND
 * 	- Cash flow entries are marked as COMPLETED when added via controller
 * 	- `restore` functionality should not be implemented
 * 	- On `delete` if entry has refunds the operation is blocked unless `force` argument is present and then refunds are also deleted
 * 	- Status update is controlled via STATUS_TRANSITIONS
 */
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
       (category_type = 'expense' AND direction = 'out')))
  )
  OR 
  (
    -- Refunds / corrections
    (parent_id IS NOT NULL AND category_type = 'correction')
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
	direction!: CashFlowDirection;

	@Column({
		type: 'enum',
		enum: CashFlowCategoryTypeEnum,
		default: CashFlowCategoryTypeEnum.REVENUE,
		nullable: false,
	})
	category_type!: CashFlowCategoryType;

	@Column({
		type: 'enum',
		enum: CashFlowCategoryEnum,
		default: CashFlowCategoryEnum.CUSTOMER,
		nullable: false,
	})
	category!: CashFlowCategory;

	@Column({
		type: 'enum',
		enum: CashFlowGatewayEnum,
		default: CashFlowGatewayEnum.DIRECT,
		nullable: false,
	})
	gateway!: CashFlowGateway;

	@Column({
		type: 'enum',
		enum: CashFlowMethodEnum,
		default: CashFlowMethodEnum.CASH,
		nullable: false,
	})
	method!: CashFlowMethod;

	@Column({
		type: 'enum',
		enum: CashFlowStatusEnum,
		default: CashFlowStatusEnum.PENDING,
		nullable: false,
	})
	status!: CashFlowStatus;

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
	currency!: Currency;

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
		() => CashFlowEntity,
		(cashFlow: CashFlowEntity) => cashFlow.parent,
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
	parent!: CashFlowEntity | null;
}
