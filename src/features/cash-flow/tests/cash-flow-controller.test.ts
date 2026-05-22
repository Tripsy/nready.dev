import { jest } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '@/app';
import type CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import {
	cashFlowInputPayloads,
	getCashFlowEntityMock,
} from '@/features/cash-flow/cash-flow.mock';
import { cashFlowPolicy } from '@/features/cash-flow/cash-flow.policy';
import cashFlowRoutes from '@/features/cash-flow/cash-flow.routes';
import { cashFlowService } from '@/features/cash-flow/cash-flow.service';
import type { CashFlowValidator } from '@/features/cash-flow/cash-flow.validator';
import {
	testControllerCreate,
	testControllerFind,
	testControllerRead,
	testControllerUpdate,
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

const controller = 'CashFlowController';
const basePath = cashFlowRoutes.basePath;

testControllerCreate<CashFlowEntity, CashFlowValidator>({
	controller: controller,
	route: basePath,
	entityMock: getCashFlowEntityMock(),
	policy: cashFlowPolicy,
	service: cashFlowService,
	createData: cashFlowInputPayloads.create,
});

testControllerUpdate<CashFlowEntity, CashFlowValidator>({
	controller: controller,
	route: `${basePath}/${getCashFlowEntityMock().id}`,
	entityMock: getCashFlowEntityMock(),
	policy: cashFlowPolicy,
	service: cashFlowService,
	updateData: cashFlowInputPayloads.update,
});

testControllerRead<CashFlowEntity>({
	controller: controller,
	route: `${basePath}/${getCashFlowEntityMock().id}`,
	entityMock: getCashFlowEntityMock(),
	policy: cashFlowPolicy,
});

describe(`${controller} - delete`, () => {
	const route = `${basePath}/${getCashFlowEntityMock().id}`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).delete(route).query({});

		withDebugResponse(() => {
			expect(response.status).toBe(401);
		}, response);
	});

	it("should fail if it doesn't have proper permission", async () => {
		notAuthorizedSpy(cashFlowPolicy);

		const response = await request(app).delete(route).query({});

		withDebugResponse(() => {
			expect(response.status).toBe(403);
		}, response);
	});

	it('should return success', async () => {
		authorizedSpy(cashFlowPolicy);

		jest.spyOn(cashFlowService, 'delete').mockResolvedValue();

		const response = await request(app).delete(route).query({});

		withDebugResponse(() => {
			expect(response.status).toBe(200);
		}, response);
	});
});

testControllerFind<CashFlowEntity, CashFlowValidator>({
	controller: controller,
	route: basePath,
	entityMock: getCashFlowEntityMock(),
	policy: cashFlowPolicy,
	service: cashFlowService,
	findData: cashFlowInputPayloads.find,
});
