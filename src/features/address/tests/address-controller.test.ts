import { jest } from '@jest/globals';
import type AddressEntity from '@/features/address/address.entity';
import {
	addressInputPayloads,
	getAddressEntityMock,
} from '@/features/address/address.mock';
import { addressPolicy } from '@/features/address/address.policy';
import addressRoutes from '@/features/address/address.routes';
import { addressService } from '@/features/address/address.service';
import type { AddressValidator } from '@/features/address/address.validator';
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

const controller = 'AddressController';
const basePath = (await addressRoutes()).basePath;

testControllerCreate<AddressEntity, AddressValidator>({
	controller: controller,
	route: `${basePath}`,
	entityMock: getAddressEntityMock(),
	policy: addressPolicy,
	service: addressService,
	createData: addressInputPayloads.create,
});

testControllerUpdate<AddressEntity, AddressValidator>({
	controller: controller,
	route: `${basePath}/${getAddressEntityMock().id}`,
	entityMock: getAddressEntityMock(),
	policy: addressPolicy,
	service: addressService,
	updateData: addressInputPayloads.update,
});

testControllerRead<AddressEntity>({
	controller: controller,
	route: `${basePath}/${getAddressEntityMock().id}`,
	entityMock: getAddressEntityMock(),
	policy: addressPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getAddressEntityMock().id}`,
	policy: addressPolicy,
	service: addressService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getAddressEntityMock().id}/restore`,
	policy: addressPolicy,
	service: addressService,
});

testControllerFind<AddressEntity, AddressValidator>({
	controller: controller,
	route: basePath,
	entityMock: getAddressEntityMock(),
	policy: addressPolicy,
	service: addressService,
	findData: addressInputPayloads.find,
});
