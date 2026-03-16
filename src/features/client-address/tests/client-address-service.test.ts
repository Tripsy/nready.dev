import { expect, jest } from '@jest/globals';
import type { EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { CustomError } from '@/exceptions';
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
import type RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import {
	createMockQuery,
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
} from '@/tests/jest-service.setup';

function createMockRepositoryForPlace<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>() {
	const query = createMockQuery() as unknown as jest.Mocked<Q>;

	const createQueryMock = jest.fn(() => {
		return query;
	});

	const repository = {
		createQuery: createQueryMock,
		save: jest.fn(),
	} as unknown as jest.Mocked<Repository<E>> & {
		createQuery(): Q;
	};

	return {
		query,
		repository,
	};
}

describe('ClientService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockPlace = createMockRepositoryForPlace<PlaceEntity, PlaceQuery>();

	const mockScopedRepository = createMockRepositoryForPlace<
		PlaceEntity,
		PlaceQuery
	>();

	const getScopedPlaceRepository = jest
		.fn()
		.mockReturnValue(
			mockScopedRepository.repository,
		) as jest.MockedFunction<
		(manager?: EntityManager) => Repository<PlaceEntity>
	>;

	const servicePlace = new PlaceService(
		mockPlace.repository,
		getScopedPlaceRepository,
	);

	const mockClientAddress = createMockRepository<
		ClientAddressEntity,
		ClientAddressQuery
	>();

	const serviceClientAddress = new ClientAddressService(
		mockClientAddress.repository,
		servicePlace,
	);

	it('should fail when address city id does not have type CITY', async () => {
		const entity = getClientAddressEntityMock();
		const createData = clientAddressOutputPayloads.get('create');

		jest.spyOn(servicePlace, 'findById').mockResolvedValue({
			...getPlaceEntityMock(),
			type: PlaceTypeEnum.COUNTRY,
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
		const createData = clientAddressOutputPayloads.get('create');

		jest.spyOn(
			serviceClientAddress,
			'checkAddressCityId',
		).mockImplementationOnce(() => Promise.resolve());
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
		clientAddressOutputPayloads.get('find'),
	);
});
