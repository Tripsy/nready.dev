import { jest } from '@jest/globals';
import type CarrierEntity from '@/features/carrier/carrier.entity';
import {
	carrierInputPayloads,
	getCarrierEntityMock,
} from '@/features/carrier/carrier.mock';
import { carrierPolicy } from '@/features/carrier/carrier.policy';
import carrierRoutes from '@/features/carrier/carrier.routes';
import { carrierService } from '@/features/carrier/carrier.service';
import type { CarrierValidator } from '@/features/carrier/carrier.validator';
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

const controller = 'CarrierController';
const basePath = carrierRoutes.basePath;

testControllerCreate<CarrierEntity, CarrierValidator>({
	controller: controller,
	route: basePath,
	entityMock: getCarrierEntityMock(),
	policy: carrierPolicy,
	service: carrierService,
	createData: carrierInputPayloads.create,
});

testControllerUpdate<CarrierEntity, CarrierValidator>({
	controller: controller,
	route: `${basePath}/${getCarrierEntityMock().id}`,
	entityMock: getCarrierEntityMock(),
	policy: carrierPolicy,
	service: carrierService,
	updateData: carrierInputPayloads.update,
});

testControllerRead<CarrierEntity>({
	controller: controller,
	route: `${basePath}/${getCarrierEntityMock().id}`,
	entityMock: getCarrierEntityMock(),
	policy: carrierPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getCarrierEntityMock().id}`,
	policy: carrierPolicy,
	service: carrierService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getCarrierEntityMock().id}/restore`,
	policy: carrierPolicy,
	service: carrierService,
});

testControllerFind<CarrierEntity, CarrierValidator>({
	controller: controller,
	route: basePath,
	entityMock: getCarrierEntityMock(),
	policy: carrierPolicy,
	service: carrierService,
	findData: carrierInputPayloads.find,
});
