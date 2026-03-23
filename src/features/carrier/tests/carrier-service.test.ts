import { expect, jest } from '@jest/globals';
import type CarrierEntity from '@/features/carrier/carrier.entity';
import {
	carrierOutputPayloads,
	getCarrierEntityMock,
} from '@/features/carrier/carrier.mock';
import type { CarrierQuery } from '@/features/carrier/carrier.repository';
import { CarrierService } from '@/features/carrier/carrier.service';
import type { CarrierValidator } from '@/features/carrier/carrier.validator';
import {
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
} from '@/tests/jest-service.setup';

describe('CarrierService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockCarrier = createMockRepository<CarrierEntity, CarrierQuery>();

	const serviceCarrier = new CarrierService(mockCarrier.repository);

	it('should create entry', async () => {
		const entity = getCarrierEntityMock();
		const createData = carrierOutputPayloads.create;

		jest.spyOn(serviceCarrier, 'findByName').mockResolvedValue(null);
		mockCarrier.repository.save.mockResolvedValue(entity);

		const result = await serviceCarrier.create(createData);

		expect(mockCarrier.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<CarrierEntity>(
		serviceCarrier,
		mockCarrier.repository,
		getCarrierEntityMock(),
	);

	testServiceDelete<CarrierEntity, CarrierQuery>(
		mockCarrier.query,
		serviceCarrier,
	);
	testServiceRestore<CarrierEntity, CarrierQuery>(
		mockCarrier.query,
		serviceCarrier,
	);
	testServiceFindById<CarrierEntity, CarrierQuery>(
		mockCarrier.query,
		serviceCarrier,
	);

	testServiceFindByFilter<CarrierEntity, CarrierQuery, CarrierValidator>(
		mockCarrier.query,
		serviceCarrier,
		carrierOutputPayloads.find,
	);
});
