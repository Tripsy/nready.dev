import { jest } from '@jest/globals';
import type UserEntity from '@/features/user/user.entity';
import {
	getUserEntityMock,
	userInputPayloads,
} from '@/features/user/user.mock';
import { userPolicy } from '@/features/user/user.policy';
import userRoutes from '@/features/user/user.routes';
import { userService } from '@/features/user/user.service';
import type { UserValidator } from '@/features/user/user.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerStatusUpdate,
	testControllerUpdate,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'UserController';
const basePath = userRoutes.basePath;

testControllerCreate<UserEntity, UserValidator>({
	controller: controller,
	route: basePath,
	entityMock: getUserEntityMock(),
	policy: userPolicy,
	service: userService,
	createData: userInputPayloads.create,
});

testControllerUpdate<UserEntity, UserValidator>({
	controller: controller,
	route: `${basePath}/${getUserEntityMock().id}`,
	entityMock: getUserEntityMock(),
	policy: userPolicy,
	service: userService,
	updateData: userInputPayloads.update,
});

testControllerRead<UserEntity>({
	controller: controller,
	route: `${basePath}/${getUserEntityMock().id}`,
	entityMock: getUserEntityMock(),
	policy: userPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getUserEntityMock().id}`,
	policy: userPolicy,
	service: userService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getUserEntityMock().id}/restore`,
	policy: userPolicy,
	service: userService,
});

testControllerFind<UserEntity, UserValidator>({
	controller: controller,
	route: basePath,
	entityMock: getUserEntityMock(),
	policy: userPolicy,
	service: userService,
	findData: userInputPayloads.find,
});

testControllerStatusUpdate<UserEntity>({
	controller: controller,
	route: `${basePath}/${getUserEntityMock().id}/status/active`,
	entityMock: getUserEntityMock(),
	policy: userPolicy,
	service: userService,
});
