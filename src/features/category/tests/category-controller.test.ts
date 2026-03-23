import { jest } from '@jest/globals';
import type CategoryEntity from '@/features/category/category.entity';
import {
	categoryInputPayloads,
	getCategoryEntityMock,
} from '@/features/category/category.mock';
import { categoryPolicy } from '@/features/category/category.policy';
import categoryRoutes from '@/features/category/category.routes';
import { categoryService } from '@/features/category/category.service';
import type { CategoryValidator } from '@/features/category/category.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerStatusUpdate,
	testControllerUpdateWithContent,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'CategoryController';
const basePath = categoryRoutes.basePath;

testControllerCreate<CategoryEntity, CategoryValidator>({
	controller: controller,
	route: basePath,
	entityMock: getCategoryEntityMock(),
	policy: categoryPolicy,
	service: categoryService,
	createData: categoryInputPayloads.create,
});

testControllerUpdateWithContent<CategoryEntity, CategoryValidator>({
	controller: controller,
	route: `${basePath}/${getCategoryEntityMock().id}`,
	entityMock: getCategoryEntityMock(),
	policy: categoryPolicy,
	service: categoryService,
	updateData: categoryInputPayloads.update,
});

testControllerRead<CategoryEntity>({
	controller: controller,
	route: `${basePath}/${getCategoryEntityMock().id}`,
	entityMock: getCategoryEntityMock(),
	policy: categoryPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getCategoryEntityMock().id}`,
	policy: categoryPolicy,
	service: categoryService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getCategoryEntityMock().id}/restore`,
	policy: categoryPolicy,
	service: categoryService,
});

testControllerFind<CategoryEntity, CategoryValidator>({
	controller: controller,
	route: basePath,
	entityMock: getCategoryEntityMock(),
	policy: categoryPolicy,
	service: categoryService,
	findData: categoryInputPayloads.find,
});

testControllerStatusUpdate<CategoryEntity>({
	controller: controller,
	route: `${basePath}/${getCategoryEntityMock().id}/status/active`,
	entityMock: getCategoryEntityMock(),
	policy: categoryPolicy,
	service: categoryService,
});
