import { expect, jest } from '@jest/globals';
import type DiscountEntity from '@/features/discount/discount.entity';
import {
	discountOutputPayloads,
	getDiscountEntityMock,
} from '@/features/discount/discount.mock';
import type { DiscountQuery } from '@/features/discount/discount.repository';
import { DiscountService } from '@/features/discount/discount.service';
import type { DiscountValidator } from '@/features/discount/discount.validator';
import {
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
} from '@/tests/jest-service.setup';

describe('DiscountService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockDiscount = createMockRepository<DiscountEntity, DiscountQuery>();

	const serviceDiscount = new DiscountService(mockDiscount.repository);

	it('should create entry', async () => {
		const entity = getDiscountEntityMock();
		const createData = discountOutputPayloads.create;

		mockDiscount.repository.save.mockResolvedValue(entity);

		const result = await serviceDiscount.create(createData);

		expect(mockDiscount.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<DiscountEntity>(
		serviceDiscount,
		mockDiscount.repository,
		getDiscountEntityMock(),
	);

	testServiceDelete<DiscountEntity, DiscountQuery>(
		mockDiscount.query,
		serviceDiscount,
	);
	testServiceRestore<DiscountEntity, DiscountQuery>(
		mockDiscount.query,
		serviceDiscount,
	);
	testServiceFindById<DiscountEntity, DiscountQuery>(
		mockDiscount.query,
		serviceDiscount,
	);

	testServiceFindByFilter<DiscountEntity, DiscountQuery, DiscountValidator>(
		mockDiscount.query,
		serviceDiscount,
		discountOutputPayloads.find,
	);
});
