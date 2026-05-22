import { expect, jest } from '@jest/globals';
import { CustomError } from '@/exceptions';
import type AddressEntity from '@/features/address/address.entity';
import {
	addressOutputPayloads,
	getAddressEntityMock,
} from '@/features/address/address.mock';
import type { AddressQuery } from '@/features/address/address.repository';
import { AddressService } from '@/features/address/address.service';
import type { AddressValidator } from '@/features/address/address.validator';
import type PlaceEntity from '@/features/place/place.entity';
import { PlaceTypeEnum } from '@/features/place/place.entity';
import { getPlaceEntityMock } from '@/features/place/place.mock';
import type { PlaceQuery } from '@/features/place/place.repository';
import { PlaceService } from '@/features/place/place.service';
import {
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
} from '@/tests/jest-service.setup';

describe('ClientService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockPlace = createMockRepository<PlaceEntity, PlaceQuery>();

	const servicePlace = new PlaceService(mockPlace.repository);

	const mockAddress = createMockRepository<AddressEntity, AddressQuery>();

	const serviceAddress = new AddressService(
		mockAddress.repository,
		servicePlace,
	);

	it('should fail when address city id does not have type CITY', async () => {
		const createData = addressOutputPayloads.create;

		jest.spyOn(servicePlace, 'findById').mockResolvedValue({
			...getPlaceEntityMock(),
			place_type: PlaceTypeEnum.COUNTRY,
		});

		// Use try/catch to test the error
		try {
			await serviceAddress.create(createData);

			// If we get here, the test should fail
			expect('This line should not be reached').toBe(
				'Error was expected',
			);
		} catch (error) {
			expect(error).toBeInstanceOf(CustomError);
		}

		// Verify that save was NOT called
		expect(mockAddress.repository.save).not.toHaveBeenCalled();
	});

	it('should create entry', async () => {
		const entity = getAddressEntityMock();
		const createData = addressOutputPayloads.create;

		jest.spyOn(serviceAddress, 'checkCityId').mockImplementationOnce(() =>
			Promise.resolve(),
		);
		mockAddress.repository.save.mockResolvedValue(entity);

		const result = await serviceAddress.create(createData);

		expect(mockAddress.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<AddressEntity>(
		serviceAddress,
		mockAddress.repository,
		getAddressEntityMock(),
	);

	testServiceDelete<AddressEntity, AddressQuery>(
		mockAddress.query,
		serviceAddress,
	);

	testServiceRestore<AddressEntity, AddressQuery>(
		mockAddress.query,
		serviceAddress,
	);

	testServiceFindById<AddressEntity, AddressQuery>(
		mockAddress.query,
		serviceAddress,
	);

	testServiceFindByFilter<AddressEntity, AddressQuery, AddressValidator>(
		mockAddress.query,
		serviceAddress,
		addressOutputPayloads.find,
	);
});
