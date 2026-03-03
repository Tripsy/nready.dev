import { expect, jest } from '@jest/globals';
import { BadRequestError } from '@/exceptions';
import type CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import {
	CashFlowCategoryEnum,
	CashFlowCategoryTypeEnum,
	CashFlowDirectionEnum,
	CashFlowStatusEnum,
	CURRENCY_DEFAULT,
	CurrencyEnum,
} from '@/features/cash-flow/cash-flow.entity';
import {
	cashFlowInputPayloads,
	cashFlowOutputPayloads,
	getCashFlowEntityMock,
} from '@/features/cash-flow/cash-flow.mock';
import type { CashFlowQuery } from '@/features/cash-flow/cash-flow.repository';
import { CashFlowService } from '@/features/cash-flow/cash-flow.service';
import type { CashFlowValidator } from '@/features/cash-flow/cash-flow.validator';
import {
	createMockRepository,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceUpdateStatus,
} from '@/tests/jest-service.setup';

describe('CashFlowService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockCashFlow = createMockRepository<CashFlowEntity, CashFlowQuery>();

	const serviceCashFlow = new CashFlowService(mockCashFlow.repository);

	it('checkDirection - should NOT throw when direction is IN', async () => {
		expect(() =>
			serviceCashFlow.checkDirection(
				CashFlowCategoryTypeEnum.REVENUE,
				CashFlowDirectionEnum.IN,
			),
		).not.toThrow();
	});

	it('checkDirection - should throw when direction is OUT', async () => {
		expect(() =>
			serviceCashFlow.checkDirection(
				CashFlowCategoryTypeEnum.REVENUE,
				CashFlowDirectionEnum.OUT,
			),
		).toThrow(BadRequestError);
	});

	it('checkCategoryType - should NOT throw when category belongs to proper category_type', async () => {
		expect(() =>
			serviceCashFlow.checkCategoryType(
				CashFlowCategoryTypeEnum.REVENUE,
				CashFlowCategoryEnum.CUSTOMER,
			),
		).not.toThrow(BadRequestError);
	});

	it('checkCategoryType - should throw when category not assigned to proper category_type', async () => {
		expect(() =>
			serviceCashFlow.checkCategoryType(
				CashFlowCategoryTypeEnum.EXPENSE,
				CashFlowCategoryEnum.CUSTOMER,
			),
		).toThrow();
	});

	it('checkCategory - should throw when parent_id is not present', async () => {
		expect(() =>
			serviceCashFlow.checkCategory(
				CashFlowCategoryEnum.REFUND,
				undefined,
			),
		).toThrow(BadRequestError);
	});

	it('checkAmount - should throw when amount is below 0', async () => {
		expect(() => serviceCashFlow.checkAmount(-10000)).toThrow(
			BadRequestError,
		);
	});

	it('checkRefund - should throw when invalid category is set', async () => {
		await expect(() =>
			serviceCashFlow.checkRefund({
				category: CashFlowCategoryEnum.FUEL,
				amount: 2500,
				currency: CURRENCY_DEFAULT,
				parentEntry: getCashFlowEntityMock(),
				refundedAmount: 10000,
			}),
		).rejects.toThrow('cash-flow.validation.category_invalid');
	});

	it('checkRefund - should throw when parent status is not appropriate', async () => {
		await expect(() =>
			serviceCashFlow.checkRefund({
				category: CashFlowCategoryEnum.REFUND,
				amount: 2500,
				currency: CURRENCY_DEFAULT,
				parentEntry: getCashFlowEntityMock({
					status: CashFlowStatusEnum.CANCELED,
				}),
				refundedAmount: 10000,
			}),
		).rejects.toThrow('cash-flow.error.refund_parent_status_invalid');
	});

	it('checkRefund - should throw when currency is not matching', async () => {
		await expect(() =>
			serviceCashFlow.checkRefund({
				category: CashFlowCategoryEnum.REFUND,
				amount: 2500,
				currency: CURRENCY_DEFAULT,
				parentEntry: getCashFlowEntityMock({
					currency: CurrencyEnum.EUR,
				}),
				refundedAmount: 10000,
			}),
		).rejects.toThrow('cash-flow.error.refund_parent_same_currency');
	});

	it('checkRefund - should throw when parent category type is CORRECTION', async () => {
		await expect(() =>
			serviceCashFlow.checkRefund({
				category: CashFlowCategoryEnum.REFUND,
				amount: 2500,
				currency: CURRENCY_DEFAULT,
				parentEntry: getCashFlowEntityMock({
					category_type: CashFlowCategoryTypeEnum.CORRECTION,
				}),
				refundedAmount: 10000,
			}),
		).rejects.toThrow(
			'cash-flow.error.refund_parent_category_type_invalid',
		);
	});

	it('checkRefund - should throw when parent category is EMPLOYEE_SALARY', async () => {
		await expect(() =>
			serviceCashFlow.checkRefund({
				category: CashFlowCategoryEnum.REFUND,
				amount: 2500,
				currency: CURRENCY_DEFAULT,
				parentEntry: getCashFlowEntityMock({
					category: CashFlowCategoryEnum.EMPLOYEE_SALARY,
				}),
				refundedAmount: 10000,
			}),
		).rejects.toThrow('cash-flow.error.refund_parent_category_invalid');
	});

	it('checkRefund - should throw when parent amount is smaller than amount', async () => {
		await expect(() =>
			serviceCashFlow.checkRefund({
				category: CashFlowCategoryEnum.REFUND,
				amount: 2500,
				currency: CURRENCY_DEFAULT,
				parentEntry: getCashFlowEntityMock({
					amount: 1000,
				}),
				refundedAmount: 10000,
			}),
		).rejects.toThrow('cash-flow.error.refund_amount_mismatch');
	});

	it('checkRefund - should throw when amount is bigger than refundable amount left', async () => {
		await expect(() =>
			serviceCashFlow.checkRefund({
				category: CashFlowCategoryEnum.REFUND,
				amount: 2500,
				currency: CURRENCY_DEFAULT,
				parentEntry: getCashFlowEntityMock({
					amount: 12000,
				}),
				refundedAmount: 10000,
			}),
		).rejects.toThrow('cash-flow.error.refund_amount_mismatch');
	});

	it('getExchangeRate - should return 1 for default currency', () => {
		const result = serviceCashFlow.getExchangeRate(CURRENCY_DEFAULT);

		expect(result).toBe(1);
	});

	it('should create entry - refund', async () => {
		const entity = getCashFlowEntityMock({
			category: CashFlowCategoryEnum.REFUND,
			parent_id: 1,
		});

		const createData = cashFlowOutputPayloads.get('create');

		jest.spyOn(serviceCashFlow, 'checkDirection').mockImplementationOnce(
			() => null,
		);
		jest.spyOn(serviceCashFlow, 'checkCategoryType').mockImplementationOnce(
			() => null,
		);
		jest.spyOn(serviceCashFlow, 'checkCategory').mockImplementationOnce(
			() => null,
		);
		jest.spyOn(serviceCashFlow, 'checkAmount').mockImplementationOnce(
			() => null,
		);

		jest.spyOn(serviceCashFlow, 'findById').mockResolvedValue(
			getCashFlowEntityMock(),
		);

		jest.spyOn(serviceCashFlow, 'checkRefund').mockImplementationOnce(
			async () => {
				return;
			},
		);

		mockCashFlow.repository.save.mockResolvedValue(entity);

		const result = await serviceCashFlow.create(createData);

		expect(mockCashFlow.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	it('on updateData throw error when updating entry with wrong status', async () => {
		const entity = getCashFlowEntityMock({
			status: CashFlowStatusEnum.COMPLETED,
		});

		jest.spyOn(serviceCashFlow, 'findById').mockResolvedValue(entity);

		await expect(
			serviceCashFlow.updateData(
				entity.id,
				cashFlowInputPayloads.get('update'),
			),
		).rejects.toThrow('cash-flow.error.update_not_allowed');
	});

	it('should call update when status is mutable', async () => {
		const entity = getCashFlowEntityMock({
			status: CashFlowStatusEnum.PENDING,
		});

		const payload = cashFlowInputPayloads.get('update');

		jest.spyOn(serviceCashFlow, 'findById').mockResolvedValue(entity);

		const updateSpy = jest
			.spyOn(serviceCashFlow, 'update')
			.mockResolvedValue(entity);

		await serviceCashFlow.updateData(entity.id, payload);

		expect(updateSpy).toHaveBeenCalled();
	});

	testServiceUpdateStatus<CashFlowEntity, CashFlowStatusEnum>(
		serviceCashFlow,
		mockCashFlow.repository,
		{
			good: {
				from: CashFlowStatusEnum.PENDING,
				to: CashFlowStatusEnum.AUTHORIZED,
			},
			bad: {
				from: CashFlowStatusEnum.COMPLETED,
				to: CashFlowStatusEnum.EXPIRED,
			},
		},
	);

	it('should update status with success', async () => {
		const entity = getCashFlowEntityMock({
			status: CashFlowStatusEnum.PENDING,
		});

		jest.spyOn(serviceCashFlow, 'findById').mockResolvedValue(entity);

		mockCashFlow.repository.save.mockResolvedValue(entity);

		await serviceCashFlow.updateStatus(
			entity.id,
			CashFlowStatusEnum.COMPLETED,
			false,
		);

		expect(mockCashFlow.repository.save).toHaveBeenCalled();
	});

	it('should delete by id', async () => {
		const entity = getCashFlowEntityMock({
			status: CashFlowStatusEnum.PENDING,
		});

		mockCashFlow.query.first.mockResolvedValue(entity);
		mockCashFlow.query.delete.mockResolvedValue(1);

		await serviceCashFlow.delete(1, false);

		expect(mockCashFlow.query.delete).toHaveBeenCalledWith();
	});

	testServiceFindById<CashFlowEntity, CashFlowQuery>(
		mockCashFlow.query,
		serviceCashFlow,
	);

	testServiceFindByFilter<CashFlowEntity, CashFlowQuery, CashFlowValidator>(
		mockCashFlow.query,
		serviceCashFlow,
		cashFlowOutputPayloads.get('find'),
	);
});
