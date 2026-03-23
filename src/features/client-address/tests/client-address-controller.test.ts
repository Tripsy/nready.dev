import { jest } from '@jest/globals';
import { getClientEntityMock } from '@/features/client/client.mock';
import type ClientAddressEntity from '@/features/client-address/client-address.entity';
import {
	clientAddressInputPayloads,
	getClientAddressEntityMock,
} from '@/features/client-address/client-address.mock';
import { clientAddressPolicy } from '@/features/client-address/client-address.policy';
import clientAddressRoutes from '@/features/client-address/client-address.routes';
import { clientAddressService } from '@/features/client-address/client-address.service';
import type { ClientAddressValidator } from '@/features/client-address/client-address.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerUpdate,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'ClientAddressController';
const basePath = clientAddressRoutes.basePath;
const clientMock = getClientEntityMock();
const clientId = clientMock.id;

testControllerCreate<ClientAddressEntity, ClientAddressValidator>({
	controller: controller,
	route: `${basePath}/${clientId}`,
	entityMock: getClientAddressEntityMock(),
	policy: clientAddressPolicy,
	service: clientAddressService,
	createData: clientAddressInputPayloads.create,
});

testControllerUpdate<ClientAddressEntity, ClientAddressValidator>({
	controller: controller,
	route: `${basePath}/${clientId}/${getClientAddressEntityMock().id}`,
	entityMock: getClientAddressEntityMock(),
	policy: clientAddressPolicy,
	service: clientAddressService,
	updateData: clientAddressInputPayloads.update,
});

testControllerRead<ClientAddressEntity>({
	controller: controller,
	route: `${basePath}/${clientId}/${getClientAddressEntityMock().id}`,
	entityMock: getClientAddressEntityMock(),
	policy: clientAddressPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${clientId}/${getClientAddressEntityMock().id}`,
	policy: clientAddressPolicy,
	service: clientAddressService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${clientId}/${getClientAddressEntityMock().id}/restore`,
	policy: clientAddressPolicy,
	service: clientAddressService,
});

testControllerFind<ClientAddressEntity, ClientAddressValidator>({
	controller: controller,
	route: basePath,
	entityMock: getClientAddressEntityMock(),
	policy: clientAddressPolicy,
	service: clientAddressService,
	findData: clientAddressInputPayloads.find,
});
