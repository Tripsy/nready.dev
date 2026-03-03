import { expect, jest } from '@jest/globals';
import type { ObjectLiteral, Repository } from 'typeorm';
import type ClientEntity from '@/features/client/client.entity';
import type { ClientIdentityData } from '@/features/client/client.entity';
import { ClientStatusEnum } from '@/features/client/client.entity';
import {
	clientOutputPayloads,
	getClientEntityMock,
} from '@/features/client/client.mock';
import type { ClientQuery } from '@/features/client/client.repository';
import { ClientService } from '@/features/client/client.service';
import type { ClientValidator } from '@/features/client/client.validator';
import type RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import {
	createMockQuery,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
	testServiceUpdateStatus,
} from '@/tests/jest-service.setup';

function createMockRepositoryForClient<
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
		isDuplicateIdentity: jest.fn(),
	} as unknown as jest.Mocked<Repository<E>> & {
		createQuery(): Q;
		isDuplicateIdentity: jest.MockedFunction<
			(data: ClientIdentityData, excludeId?: number) => Promise<boolean>
		>;
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

	const mockClient = createMockRepositoryForClient<
		ClientEntity,
		ClientQuery
	>();

	const serviceClient = new ClientService(mockClient.repository);

	it('should create entry', async () => {
		const entity = getClientEntityMock();
		const createData = clientOutputPayloads.get('create');

		mockClient.repository.isDuplicateIdentity.mockResolvedValue(false);

		mockClient.repository.save.mockResolvedValue(entity);

		const result = await serviceClient.create(createData);

		expect(mockClient.repository.isDuplicateIdentity).toHaveBeenCalled();
		expect(mockClient.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<ClientEntity>(
		serviceClient,
		mockClient.repository,
		getClientEntityMock(),
	);

	testServiceUpdateStatus<ClientEntity, ClientStatusEnum>(
		serviceClient,
		mockClient.repository,
		{
			good: {
				from: ClientStatusEnum.INACTIVE,
				to: ClientStatusEnum.ACTIVE,
			},
			bad: undefined,
		},
	);

	testServiceFindById<ClientEntity, ClientQuery>(
		mockClient.query,
		serviceClient,
	);

	testServiceFindByFilter<ClientEntity, ClientQuery, ClientValidator>(
		mockClient.query,
		serviceClient,
		clientOutputPayloads.get('find'),
	);

	testServiceDelete<ClientEntity, ClientQuery>(
		mockClient.query,
		serviceClient,
	);
	testServiceRestore<ClientEntity, ClientQuery>(
		mockClient.query,
		serviceClient,
	);
});
