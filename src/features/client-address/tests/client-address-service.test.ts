import { expect, jest } from '@jest/globals';
import type { EntityManager, Repository } from 'typeorm';
import { CustomError } from '@/exceptions';
import type ClientEntity from '@/features/client/client.entity';
import type { ClientQuery } from '@/features/client/client.repository';
import { ClientService } from '@/features/client/client.service';
import type ClientAddressEntity from '@/features/client-address/client-address.entity';
import {
	clientAddressOutputPayloads,
	getClientAddressEntityMock,
} from '@/features/client-address/client-address.mock';
import type { ClientAddressQuery } from '@/features/client-address/client-address.repository';
import { ClientAddressService } from '@/features/client-address/client-address.service';
import type { ClientAddressValidator } from '@/features/client-address/client-address.validator';
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

	const getScopedPlaceRepository = jest
		.fn()
		.mockReturnValue(mockPlace.repository) as jest.MockedFunction<
		(manager?: EntityManager) => Repository<PlaceEntity>
	>;

	const servicePlace = new PlaceService(
		mockPlace.repository,
		getScopedPlaceRepository,
	);

	const mockClient = createMockRepository<ClientEntity, ClientQuery>();

	const serviceClient = new ClientService(mockClient.repository);

	const mockClientAddress = createMockRepository<
		ClientAddressEntity,
		ClientAddressQuery
	>();

	const serviceClientAddress = new ClientAddressService(
		mockClientAddress.repository,
		serviceClient,
		servicePlace,
	);

	it('should fail when address city id does not have type CITY', async () => {
		const entity = getClientAddressEntityMock();
		const createData = clientAddressOutputPayloads.create;

		jest.spyOn(servicePlace, 'findById').mockResolvedValue({
			...getPlaceEntityMock(),
			place_type: PlaceTypeEnum.COUNTRY,
		});

		// Use try/catch to test the error
		try {
			await serviceClientAddress.create(createData, entity.client_id);

			// If we get here, the test should fail
			expect('This line should not be reached').toBe(
				'Error was expected',
			);
		} catch (error) {
			expect(error).toBeInstanceOf(CustomError);
		}

		// Verify that save was NOT called
		expect(mockClientAddress.repository.save).not.toHaveBeenCalled();
	});

	it('should create entry', async () => {
		const entity = getClientAddressEntityMock();
		const createData = clientAddressOutputPayloads.create;

		jest.spyOn(serviceClientAddress, 'checkCityId').mockImplementationOnce(
			() => Promise.resolve(),
		);
		mockClientAddress.repository.save.mockResolvedValue(entity);

		const result = await serviceClientAddress.create(
			createData,
			entity.client_id,
		);

		expect(mockClientAddress.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<ClientAddressEntity>(
		serviceClientAddress,
		mockClientAddress.repository,
		getClientAddressEntityMock(),
	);

	testServiceDelete<ClientAddressEntity, ClientAddressQuery>(
		mockClientAddress.query,
		serviceClientAddress,
	);

	testServiceRestore<ClientAddressEntity, ClientAddressQuery>(
		mockClientAddress.query,
		serviceClientAddress,
	);

	testServiceFindById<ClientAddressEntity, ClientAddressQuery>(
		mockClientAddress.query,
		serviceClientAddress,
	);

	testServiceFindByFilter<
		ClientAddressEntity,
		ClientAddressQuery,
		ClientAddressValidator
	>(
		mockClientAddress.query,
		serviceClientAddress,
		clientAddressOutputPayloads.find,
	);
});
