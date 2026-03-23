import { jest } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '@/app';
import type ClientEntity from '@/features/client/client.entity';
import {
	clientInputPayloads,
	getClientEntityMock,
} from '@/features/client/client.mock';
import { clientPolicy } from '@/features/client/client.policy';
import clientRoutes from '@/features/client/client.routes';
import { clientService } from '@/features/client/client.service';
import type { ClientValidator } from '@/features/client/client.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerStatusUpdate,
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

const controller = 'ClientController';
const basePath = clientRoutes.basePath;

testControllerCreate<ClientEntity, ClientValidator>({
	controller: controller,
	route: basePath,
	entityMock: getClientEntityMock(),
	policy: clientPolicy,
	service: clientService,
	createData: clientInputPayloads.create,
});

describe(`${controller} - update`, () => {
	const route = `${basePath}/${getClientEntityMock().id}`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).put(route).send();

		withDebugResponse(() => {
			expect(response.status).toBe(401);
		}, response);
	});

	it("should fail if it doesn't have proper permission", async () => {
		notAuthorizedSpy(clientPolicy);

		const response = await request(app).put(route).send();

		withDebugResponse(() => {
			expect(response.status).toBe(403);
		}, response);
	});

	it('should return success', async () => {
		authorizedSpy(clientPolicy);

		jest.spyOn(clientService, 'findById').mockResolvedValue(
			getClientEntityMock(),
		);

		jest.spyOn(clientService, 'updateData').mockResolvedValue(
			getClientEntityMock(),
		);

		const response = await request(app)
			.put(route)
			.send(clientInputPayloads.update);

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveProperty(
				'id',
				getClientEntityMock().id,
			);
		}, response);
	});
});

testControllerRead<ClientEntity>({
	controller: controller,
	route: `${basePath}/${getClientEntityMock().id}`,
	entityMock: getClientEntityMock(),
	policy: clientPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getClientEntityMock().id}`,
	policy: clientPolicy,
	service: clientService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getClientEntityMock().id}/restore`,
	policy: clientPolicy,
	service: clientService,
});

testControllerFind<ClientEntity, ClientValidator>({
	controller: controller,
	route: basePath,
	entityMock: getClientEntityMock(),
	policy: clientPolicy,
	service: clientService,
	findData: clientInputPayloads.find,
});

testControllerStatusUpdate<ClientEntity>({
	controller: controller,
	route: `${basePath}/${getClientEntityMock().id}/status/active`,
	entityMock: getClientEntityMock(),
	policy: clientPolicy,
	service: clientService,
});
