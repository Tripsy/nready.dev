import { expect, jest } from '@jest/globals';
import type ClientEntity from '@/features/client/client.entity';
import { ClientStatusEnum } from '@/features/client/client.entity';
import {
	clientOutputPayloads,
	getClientEntityMock,
} from '@/features/client/client.mock';
import type { ClientQuery } from '@/features/client/client.repository';
import { ClientService } from '@/features/client/client.service';
import type { ClientValidator } from '@/features/client/client.validator';
import {
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
	testServiceUpdateStatus,
} from '@/tests/jest-service.setup';

describe('ClientService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockClient = createMockRepository<ClientEntity, ClientQuery>();

	const serviceClient = new ClientService(mockClient.repository);

	it('should create entry', async () => {
		const entity = getClientEntityMock();
		const createData = clientOutputPayloads.create;

		jest.spyOn(serviceClient, 'checkDuplicate').mockResolvedValue(
			undefined,
		);

		mockClient.repository.save.mockResolvedValue(entity);

		const result = await serviceClient.create(createData);

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
		clientOutputPayloads.find,
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
