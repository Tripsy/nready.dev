import { expect, jest } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '@/app';
import { CategoryTypeEnum } from '@/features/category/category.entity';
import { getCategoryEntityMock } from '@/features/category/category.mock';
import { categoryService } from '@/features/category/category.service';
import categoryPublicRoutes from '@/features/category/category-public.routes';
import { withDebugResponse } from '@/tests/jest-controller.setup';

let app: Express;

beforeAll(async () => {
	app = await createApp();
});

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'CategoryPublicController';
const basePath = (await categoryPublicRoutes()).basePath;

/*
 * The route has no policy call, so the standard 401/403 builders do not apply. What has to be
 * proven instead is that an unauthenticated caller is served, and that the payload it can send
 * cannot reach past the published tree.
 */
describe(controller, () => {
	const entity = getCategoryEntityMock();

	it('find should answer an unauthenticated caller', async () => {
		jest.spyOn(categoryService, 'findByFilterPublic').mockResolvedValue([
			[entity],
			1,
		]);

		const response = await request(app).get(basePath);

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data.entries).toHaveLength(1);
		}, response);
	});

	it('find should default to the product tree', async () => {
		const findByFilterPublic = jest
			.spyOn(categoryService, 'findByFilterPublic')
			.mockResolvedValue([[], 0]);

		await request(app).get(basePath);

		expect(findByFilterPublic).toHaveBeenCalledWith(
			expect.objectContaining({
				filter: expect.objectContaining({
					type: CategoryTypeEnum.PRODUCT,
				}),
			}),
		);
	});

	it('find should drop a status filter instead of honoring it', async () => {
		const findByFilterPublic = jest
			.spyOn(categoryService, 'findByFilterPublic')
			.mockResolvedValue([[], 0]);

		await request(app)
			.get(basePath)
			.query({ filter: { status: 'inactive', is_deleted: 'true' } });

		const [data] = findByFilterPublic.mock.calls[0];

		expect(data.filter).not.toHaveProperty('status');
		expect(data.filter).not.toHaveProperty('is_deleted');
	});
});
