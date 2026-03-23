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
	cashFlowValidator,
	OrderByEnum,
} from '@/features/cash-flow/cash-flow.validator';
import { createPastDate, formatDate } from '@/helpers';
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
		parent: null,
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
		amount: 5000, // $50.00 in cents (refund)
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
		parent: null,
		...overrides,
	};
}

export const cashFlowInputPayloads = {
	create: {
		direction: CashFlowDirectionEnum.IN,
		category_type: CashFlowCategoryTypeEnum.REVENUE,
		category: CashFlowCategoryEnum.CUSTOMER,
		gateway: CashFlowGatewayEnum.DIRECT,
		method: CashFlowMethodEnum.CASH,
		amount: 10000,
		vat_rate: 19.0,
		currency: CurrencyEnum.RON,
		external_reference: 'REF-12345',
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
		external_reference: 'REF-12345',
		notes: 'Updated cash flow entry',
	},
	delete: {
		force: false,
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
			create_date_end: formatDate(createPastDate(10000)),
			term: 'test',
			is_deleted: false,
		},
	},
};

export const cashFlowOutputPayloads = {
	create: cashFlowValidator.create.parse(cashFlowInputPayloads.create),
	update: cashFlowValidator.update.parse(cashFlowInputPayloads.update),
	find: cashFlowValidator.find.parse(cashFlowInputPayloads.find),
};
