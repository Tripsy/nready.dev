import { jest } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '@/app';
import type ImageEntity from '@/features/image/image.entity';
import {
	getImageEntityMock,
	imageInputPayloads,
} from '@/features/image/image.mock';
import { imagePolicy } from '@/features/image/image.policy';
import imageRoutes from '@/features/image/image.routes';
import { imageService } from '@/features/image/image.service';
import type { ImageValidator } from '@/features/image/image.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
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

const controller = 'ImageController';
const basePath = (await imageRoutes()).basePath;

testControllerCreate<ImageEntity, ImageValidator>({
	controller: controller,
	route: basePath,
	entityMock: getImageEntityMock(),
	policy: imagePolicy,
	service: imageService,
	createData: imageInputPayloads.create,
});

testControllerUpdateWithContent<ImageEntity, ImageValidator>({
	controller: controller,
	route: `${basePath}/${getImageEntityMock().id}`,
	entityMock: getImageEntityMock(),
	policy: imagePolicy,
	service: imageService,
	updateData: imageInputPayloads.update,
});

testControllerRead<ImageEntity>({
	controller: controller,
	route: `${basePath}/${getImageEntityMock().id}`,
	entityMock: getImageEntityMock(),
	policy: imagePolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getImageEntityMock().id}`,
	policy: imagePolicy,
	service: imageService,
});

testControllerFind<ImageEntity, ImageValidator>({
	controller: controller,
	route: basePath,
	entityMock: getImageEntityMock(),
	policy: imagePolicy,
	service: imageService,
	findData: imageInputPayloads.find,
});

testControllerStatusUpdate<ImageEntity>({
	controller: controller,
	route: `${basePath}/${getImageEntityMock().id}/status/active`,
	entityMock: getImageEntityMock(),
	policy: imagePolicy,
	service: imageService,
});

describe(`${controller} - orderUpdate`, () => {
	const route = `${basePath}/${getImageEntityMock().image_type}/order`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).patch(route).send();

		withDebugResponse(() => {
			expect(response.status).toBe(401);
		}, response);
	});

	it("should fail if it doesn't have proper permission", async () => {
		notAuthorizedSpy(imagePolicy);

		const response = await request(app).patch(route).send();

		withDebugResponse(() => {
			expect(response.status).toBe(403);
		}, response);
	});

	it('should return success', async () => {
		authorizedSpy(imagePolicy);

		jest.spyOn(imageService, 'updateOrder').mockResolvedValue();

		const response = await request(app)
			.patch(route)
			.send(imageInputPayloads.orderUpdate);

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
		}, response);
	});
});
