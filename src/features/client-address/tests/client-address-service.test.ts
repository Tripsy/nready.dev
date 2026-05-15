import { expect, jest } from '@jest/globals';
import type { EntityManager, Repository } from 'typeorm';
import type AddressEntity from '@/features/address/address.entity';
import type { AddressQuery } from '@/features/address/address.repository';
import { AddressService } from '@/features/address/address.service';
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

	const mockAddress = createMockRepository<AddressEntity, AddressQuery>();
	const serviceAddress = new AddressService(
		mockAddress.repository,
		servicePlace,
	);

	const mockClientAddress = createMockRepository<
		ClientAddressEntity,
		ClientAddressQuery
	>();

	const serviceClientAddress = new ClientAddressService(
		mockClientAddress.repository,
		serviceClient,
		serviceAddress,
	);

	it('should create entry', async () => {
		const entity = getClientAddressEntityMock();
		const createData = clientAddressOutputPayloads.create;

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
