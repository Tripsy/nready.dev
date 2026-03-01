import type CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import {
	CashFlowCategoryEnum,
	CashFlowCategoryTypeEnum,
	CashFlowDirectionEnum,
	CashFlowGatewayEnum,
	CashFlowMethodEnum,
	CashFlowStatusEnum,
	CurrencyEnum,
} from '@/features/cash-flow/cash-flow.entity';
import {
	type CashFlowValidator,
	OrderByEnum,
} from '@/features/cash-flow/cash-flow.validator';
import { createPastDate, formatDate } from '@/helpers';
import { createValidatorPayloads } from '@/helpers/mock.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getCashFlowEntityMock(
	overrides?: Partial<CashFlowEntity>,
): CashFlowEntity {
	return {
		id: 1,
		direction: CashFlowDirectionEnum.IN,
		category_type: CashFlowCategoryTypeEnum.REVENUE,
		category: CashFlowCategoryEnum.CUSTOMER,
		gateway: CashFlowGatewayEnum.DIRECT,
		method: CashFlowMethodEnum.CASH,
		status: CashFlowStatusEnum.COMPLETED,
		amount: 10000, // $100.00 in cents
		vat_rate: 19.0,
		currency: CurrencyEnum.RON,
		exchange_rate: 1,
		external_reference: 'REF-12345',
		parent_id: null,
		transaction_id: 'txn_123456789',
		gateway_response: {
			id: 'txn_123456789',
			status: 'succeeded',
			payment_method: 'cash',
		},
		fail_reason: null,
		captured_at: createPastDate(1000),
		authorized_at: createPastDate(2000),
		notes: 'Test cash flow entry',
		created_at: createPastDate(28800),
		updated_at: null,
		deleted_at: null,
		refunds: [],
		parent_refunds: null,
		...overrides,
	};
}

export function getCashFlowRefundEntityMock(
	overrides?: Partial<CashFlowEntity>,
): CashFlowEntity {
	return {
		id: 2,
		direction: CashFlowDirectionEnum.OUT,
		category_type: CashFlowCategoryTypeEnum.CORRECTION,
		category: CashFlowCategoryEnum.CORRECTION,
		gateway: CashFlowGatewayEnum.DIRECT,
		method: CashFlowMethodEnum.BANK_TRANSFER,
		status: CashFlowStatusEnum.COMPLETED,
		amount: -5000, // -$50.00 in cents (refund)
		vat_rate: 19.0,
		currency: CurrencyEnum.RON,
		exchange_rate: 1,
		external_reference: 'REF-12345-REFUND',
		parent_id: 1,
		transaction_id: 'txn_refund_123456789',
		gateway_response: {
			id: 'txn_refund_123456789',
			status: 'succeeded',
			refund_for: 'txn_123456789',
		},
		fail_reason: null,
		captured_at: createPastDate(500),
		authorized_at: createPastDate(600),
		notes: 'Refund for transaction #1',
		created_at: createPastDate(1000),
		updated_at: null,
		deleted_at: null,
		refunds: [],
		parent_refunds: null,
		...overrides,
	};
}

export const cashFlowInputPayloads = createValidatorPayloads<
	CashFlowValidator,
	'create' | 'update' | 'find'
>({
	create: {
		direction: CashFlowDirectionEnum.IN,
		category_type: CashFlowCategoryTypeEnum.REVENUE,
		category: CashFlowCategoryEnum.CUSTOMER,
		gateway: CashFlowGatewayEnum.DIRECT,
		method: CashFlowMethodEnum.CASH,
		amount: 10000,
		vat_rate: 19.0,
		currency: CurrencyEnum.RON,
		exchange_rate: 1,
		parent_id: null,
		notes: 'Test cash flow entry',
	},
	update: {
		direction: CashFlowDirectionEnum.IN,
		category_type: CashFlowCategoryTypeEnum.REVENUE,
		category: CashFlowCategoryEnum.CUSTOMER,
		gateway: CashFlowGatewayEnum.STRIPE,
		method: CashFlowMethodEnum.CREDIT_CARD,
		amount: 12000,
		vat_rate: 19.0,
		currency: CurrencyEnum.RON,
		exchange_rate: 1,
		notes: 'Updated cash flow entry',
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			id: 1,
			direction: CashFlowDirectionEnum.IN,
			category_type: CashFlowCategoryTypeEnum.REVENUE,
			category: CashFlowCategoryEnum.CUSTOMER,
			gateway: CashFlowGatewayEnum.DIRECT,
			method: CashFlowMethodEnum.CASH,
			status: CashFlowStatusEnum.COMPLETED,
			create_date_start: formatDate(createPastDate(30000)),
			create_date_end: formatDate(createPastDate(0)),
			term: 'test',
			is_deleted: false,
		},
	},
});

export const cashFlowOutputPayloads = createValidatorPayloads<
	CashFlowValidator,
	'create' | 'find',
	'output'
>({
	create: {
		direction: CashFlowDirectionEnum.IN,
		category_type: CashFlowCategoryTypeEnum.REVENUE,
		category: CashFlowCategoryEnum.CUSTOMER,
		gateway: CashFlowGatewayEnum.DIRECT,
		method: CashFlowMethodEnum.CASH,
		amount: 10000,
		vat_rate: 19.0,
		currency: CurrencyEnum.RON,
		exchange_rate: 1,
		parent_id: null,
		notes: 'Test cash flow entry',
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			id: 1,
			direction: CashFlowDirectionEnum.IN,
			category_type: CashFlowCategoryTypeEnum.REVENUE,
			category: CashFlowCategoryEnum.CUSTOMER,
			gateway: CashFlowGatewayEnum.DIRECT,
			method: CashFlowMethodEnum.CASH,
			status: CashFlowStatusEnum.COMPLETED,
			create_date_start: createPastDate(30000),
			create_date_end: createPastDate(0),
			term: 'test',
			is_deleted: false,
		},
	},
});

// Additional specific mocks for different scenarios
export const cashFlowMocks = {
	// Revenue scenarios
	customerPayment: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.IN,
			category_type: CashFlowCategoryTypeEnum.REVENUE,
			category: CashFlowCategoryEnum.CUSTOMER,
			method: CashFlowMethodEnum.BANK_TRANSFER,
			amount: 50000, // $500.00
			...overrides,
		}),

	// Expense scenarios
	fuelPurchase: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.OUT,
			category_type: CashFlowCategoryTypeEnum.EXPENSE,
			category: CashFlowCategoryEnum.FUEL,
			method: CashFlowMethodEnum.CREDIT_CARD,
			amount: -7500, // -$75.00
			notes: 'Fuel for vehicle #5',
			...overrides,
		}),

	maintenance: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.OUT,
			category_type: CashFlowCategoryTypeEnum.EXPENSE,
			category: CashFlowCategoryEnum.MAINTENANCE,
			method: CashFlowMethodEnum.BANK_TRANSFER,
			amount: -25000, // -$250.00
			notes: 'Oil change and brake pads',
			...overrides,
		}),

	tolls: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.OUT,
			category_type: CashFlowCategoryTypeEnum.EXPENSE,
			category: CashFlowCategoryEnum.TOLLS,
			method: CashFlowMethodEnum.CREDIT_CARD,
			amount: -500, // -$5.00
			notes: 'Highway toll',
			...overrides,
		}),

	// Personnel
	employeeSalary: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.OUT,
			category_type: CashFlowCategoryTypeEnum.EXPENSE,
			category: CashFlowCategoryEnum.EMPLOYEE_SALARY,
			method: CashFlowMethodEnum.BANK_TRANSFER,
			amount: -300000, // -$3,000.00
			notes: 'Monthly salary',
			...overrides,
		}),

	employeeReimbursement: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.OUT,
			category_type: CashFlowCategoryTypeEnum.EXPENSE,
			category: CashFlowCategoryEnum.EMPLOYEE_REIMBURSEMENT,
			method: CashFlowMethodEnum.BANK_TRANSFER,
			amount: -15000, // -$150.00
			notes: 'Travel expenses reimbursement',
			...overrides,
		}),

	// Business Expenses
	vendorPayment: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.OUT,
			category_type: CashFlowCategoryTypeEnum.EXPENSE,
			category: CashFlowCategoryEnum.VENDOR,
			method: CashFlowMethodEnum.BANK_TRANSFER,
			amount: -45000, // -$450.00
			notes: 'Monthly invoice from vendor',
			...overrides,
		}),

	insurance: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.OUT,
			category_type: CashFlowCategoryTypeEnum.EXPENSE,
			category: CashFlowCategoryEnum.INSURANCE,
			method: CashFlowMethodEnum.BANK_TRANSFER,
			amount: -120000, // -$1,200.00
			notes: 'Quarterly insurance premium',
			...overrides,
		}),

	taxes: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.OUT,
			category_type: CashFlowCategoryTypeEnum.EXPENSE,
			category: CashFlowCategoryEnum.TAXES,
			method: CashFlowMethodEnum.BANK_TRANSFER,
			amount: -250000, // -$2,500.00
			notes: 'VAT payment',
			...overrides,
		}),

	// Corrections
	internalCorrection: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			direction: CashFlowDirectionEnum.IN,
			category_type: CashFlowCategoryTypeEnum.CORRECTION,
			category: CashFlowCategoryEnum.CORRECTION,
			method: CashFlowMethodEnum.CASH,
			amount: 1000, // $10.00 correction
			notes: 'Adjustment for rounding error',
			...overrides,
		}),

	// Gateway-specific
	stripePayment: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			gateway: CashFlowGatewayEnum.STRIPE,
			method: CashFlowMethodEnum.CREDIT_CARD,
			transaction_id: 'ch_123456789',
			gateway_response: {
				id: 'ch_123456789',
				amount: 10000,
				currency: 'ron',
				status: 'succeeded',
				payment_method_details: {
					card: {
						brand: 'visa',
						last4: '4242',
					},
				},
			},
			...overrides,
		}),

	paypalPayment: (overrides?: Partial<CashFlowEntity>) =>
		getCashFlowEntityMock({
			gateway: CashFlowGatewayEnum.PAYPAL,
			method: CashFlowMethodEnum.PAYPAL,
			transaction_id: 'PAY-123456789',
			gateway_response: {
				id: 'PAY-123456789',
				status: 'COMPLETED',
				payer: {
					email: 'customer@example.com',
				},
			},
			...overrides,
		}),
};
