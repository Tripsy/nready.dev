import { jest } from '@jest/globals';
import type PlaceEntity from '@/features/place/place.entity';
import {
	getPlaceEntityMock,
	placeInputPayloads,
} from '@/features/place/place.mock';
import { placePolicy } from '@/features/place/place.policy';
import placeRoutes from '@/features/place/place.routes';
import { placeService } from '@/features/place/place.service';
import type { PlaceValidator } from '@/features/place/place.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerUpdateWithContent,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'PlaceController';
const basePath = placeRoutes.basePath;

testControllerCreate<PlaceEntity, PlaceValidator>({
	controller: controller,
	route: basePath,
	entityMock: getPlaceEntityMock(),
	policy: placePolicy,
	service: placeService,
	createData: placeInputPayloads.create,
});

testControllerUpdateWithContent<PlaceEntity, PlaceValidator>({
	controller: controller,
	route: `${basePath}/${getPlaceEntityMock().id}`,
	entityMock: getPlaceEntityMock(),
	policy: placePolicy,
	service: placeService,
	updateData: placeInputPayloads.update,
});

testControllerRead<PlaceEntity>({
	controller: controller,
	route: `${basePath}/${getPlaceEntityMock().id}`,
	entityMock: getPlaceEntityMock(),
	policy: placePolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getPlaceEntityMock().id}`,
	policy: placePolicy,
	service: placeService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getPlaceEntityMock().id}/restore`,
	policy: placePolicy,
	service: placeService,
});

testControllerFind<PlaceEntity, PlaceValidator>({
	controller: controller,
	route: basePath,
	entityMock: getPlaceEntityMock(),
	policy: placePolicy,
	service: placeService,
	findData: placeInputPayloads.find,
});
