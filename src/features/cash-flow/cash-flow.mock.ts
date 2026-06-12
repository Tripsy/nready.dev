import type CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import {
	CashFlowCategoryTypeEnum,
	CashFlowDirectionEnum,
	CashFlowMethodEnum,
	CashFlowStatusEnum,
	CurrencyEnum,
} from '@/features/cash-flow/cash-flow.entity';
import {
	cashFlowValidator,
	OrderByEnum,
} from '@/features/cash-flow/cash-flow.validator';
import { CashFlowCategoryEnum } from '@/features/cash-flow/cash-flow-category.enum';
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
		method: CashFlowMethodEnum.CASH,
		status: CashFlowStatusEnum.COMPLETED,
		amount: 10000, // $100.00 in cents
		netAmount: 100,
		grossAmount: 119,
		vat_rate: 19.0,
		currency: CurrencyEnum.RON,
		exchange_rate: 1,
		external_reference: 'REF-12345',
		parent_id: null,
		notes: 'Test cash flow entry',
		created_at: createPastDate(28800),
		updated_at: null,
		deleted_at: null,
		refunds: [],
		operational_records: [],
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
		category: CashFlowCategoryEnum.REFUND,
		method: CashFlowMethodEnum.BANK_TRANSFER,
		status: CashFlowStatusEnum.COMPLETED,
		amount: 5000, // $50.00 in cents (refund)
		netAmount: 50,
		grossAmount: 59.5,
		vat_rate: 19.0,
		currency: CurrencyEnum.RON,
		exchange_rate: 1,
		external_reference: 'REF-12345-REFUND',
		parent_id: 1,
		notes: 'Refund for transaction #1',
		created_at: createPastDate(1000),
		updated_at: null,
		deleted_at: null,
		refunds: [],
		operational_records: [],
		parent: null,
		...overrides,
	};
}

export const cashFlowInputPayloads = {
	create: {
		direction: CashFlowDirectionEnum.IN,
		category_type: CashFlowCategoryTypeEnum.REVENUE,
		category: CashFlowCategoryEnum.CUSTOMER,
		method: CashFlowMethodEnum.CASH,
		amount: 10000,
		vat_rate: 19.0,
		currency: CurrencyEnum.RON,
		external_reference: 'REF-12345',
		parent_id: null,
		notes: 'Test cash flow entry',
		operational_records: {
			client: 1,
			vendor: null,
			employee: null,
		}
	},
	update: {
		direction: CashFlowDirectionEnum.IN,
		category_type: CashFlowCategoryTypeEnum.REVENUE,
		category: CashFlowCategoryEnum.CUSTOMER,
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
			method: CashFlowMethodEnum.CASH,
			status: CashFlowStatusEnum.COMPLETED,
			create_at_start: formatDate(createPastDate(30000)),
			create_at_end: formatDate(createPastDate(10000)),
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
