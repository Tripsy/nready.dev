import { jest } from '@jest/globals';
import type DiscountEntity from '@/features/discount/discount.entity';
import {
	discountInputPayloads,
	getDiscountEntityMock,
} from '@/features/discount/discount.mock';
import { discountPolicy } from '@/features/discount/discount.policy';
import discountRoutes from '@/features/discount/discount.routes';
import { discountService } from '@/features/discount/discount.service';
import type { DiscountValidator } from '@/features/discount/discount.validator';
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

const controller = 'DiscountController';
const basePath = (await discountRoutes()).basePath;

testControllerCreate<DiscountEntity, DiscountValidator>({
	controller: controller,
	route: basePath,
	entityMock: getDiscountEntityMock(),
	policy: discountPolicy,
	service: discountService,
	createData: discountInputPayloads.create,
});

testControllerUpdate<DiscountEntity, DiscountValidator>({
	controller: controller,
	route: `${basePath}/${getDiscountEntityMock().id}`,
	entityMock: getDiscountEntityMock(),
	policy: discountPolicy,
	service: discountService,
	updateData: discountInputPayloads.update,
});

testControllerRead<DiscountEntity>({
	controller: controller,
	route: `${basePath}/${getDiscountEntityMock().id}`,
	entityMock: getDiscountEntityMock(),
	policy: discountPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getDiscountEntityMock().id}`,
	policy: discountPolicy,
	service: discountService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getDiscountEntityMock().id}/restore`,
	policy: discountPolicy,
	service: discountService,
});

testControllerFind<DiscountEntity, DiscountValidator>({
	controller: controller,
	route: basePath,
	entityMock: getDiscountEntityMock(),
	policy: discountPolicy,
	service: discountService,
	findData: discountInputPayloads.find,
});
