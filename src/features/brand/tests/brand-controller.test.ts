import { jest } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '@/app';
import type BrandEntity from '@/features/brand/brand.entity';
import {
	brandInputPayloads,
	getBrandEntityMock,
} from '@/features/brand/brand.mock';
import { brandPolicy } from '@/features/brand/brand.policy';
import brandRoutes from '@/features/brand/brand.routes';
import { brandService } from '@/features/brand/brand.service';
import type { BrandValidator } from '@/features/brand/brand.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerStatusUpdate,
	testControllerUpdateWithContent,
	withDebugResponse,
} from '@/tests/jest-controller.setup';
import { authorizedSpy, notAuthorizedSpy } from '@/tests/mocks/policies.mock';

let app: Express;

beforeAll(async () => {
	app = await createApp();
});

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'BrandController';
const basePath = (await brandRoutes()).basePath;

testControllerCreate<BrandEntity, BrandValidator>({
	controller: controller,
	route: basePath,
	entityMock: getBrandEntityMock(),
	policy: brandPolicy,
	service: brandService,
	createData: brandInputPayloads.create,
});

testControllerUpdateWithContent<BrandEntity, BrandValidator>({
	controller: controller,
	route: `${basePath}/${getBrandEntityMock().id}`,
	entityMock: getBrandEntityMock(),
	policy: brandPolicy,
	service: brandService,
	updateData: brandInputPayloads.update,
});

testControllerRead<BrandEntity>({
	controller: controller,
	route: `${basePath}/${getBrandEntityMock().id}`,
	entityMock: getBrandEntityMock(),
	policy: brandPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getBrandEntityMock().id}`,
	policy: brandPolicy,
	service: brandService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getBrandEntityMock().id}/restore`,
	policy: brandPolicy,
	service: brandService,
});

testControllerFind<BrandEntity, BrandValidator>({
	controller: controller,
	route: basePath,
	entityMock: getBrandEntityMock(),
	policy: brandPolicy,
	service: brandService,
	findData: brandInputPayloads.find,
});

testControllerStatusUpdate<BrandEntity>({
	controller: controller,
	route: `${basePath}/${getBrandEntityMock().id}/status/active`,
	entityMock: getBrandEntityMock(),
	policy: brandPolicy,
	service: brandService,
});

describe(`${controller} - orderUpdate`, () => {
	const route = `${basePath}/${getBrandEntityMock().brand_type}/order`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).patch(route).send();

		withDebugResponse(() => {
			expect(response.status).toBe(401);
		}, response);
	});

	it("should fail if it doesn't have proper permission", async () => {
		notAuthorizedSpy(brandPolicy);

		const response = await request(app).patch(route).send();

		withDebugResponse(() => {
			expect(response.status).toBe(403);
		}, response);
	});

	it('should return success', async () => {
		authorizedSpy(brandPolicy);

		jest.spyOn(brandService, 'updateOrder').mockResolvedValue();

		const response = await request(app)
			.patch(route)
			.send(brandInputPayloads.orderUpdate);

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
		}, response);
	});
});
