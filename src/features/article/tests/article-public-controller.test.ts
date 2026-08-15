import { jest } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '@/app';
import { UnauthorizedError } from '@/exceptions';
import { ArticleVisibilityEnum } from '@/features/article/article.entity';
import { getArticleEntityMock } from '@/features/article/article.mock';
import articleRoutes from '@/features/article/article.routes';
import { articleService } from '@/features/article/article.service';
import { articleAccessPolicy } from '@/features/article/article-access.policy';
import articlePublicRoutes from '@/features/article/article-public.routes';
import ArticleVisibilityRuleRepository from '@/features/article/article-visibility-rule.repository';
import { withDebugResponse } from '@/tests/jest-controller.setup';

let app: Express;

beforeAll(async () => {
	app = await createApp();
});

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'ArticlePublicController';
const basePath = (await articlePublicRoutes()).basePath;
const adminBasePath = (await articleRoutes()).basePath;

/*
 * These routes have no policy call, so the standard 401/403 builders do not apply. What has to
 * be proven instead is that an *unauthenticated* caller is served, and that the access gate is
 * the thing deciding whether a restricted article comes back.
 */
describe(controller, () => {
	const entity = getArticleEntityMock();

	it('find should answer an unauthenticated caller', async () => {
		jest.spyOn(articleService, 'findByFilterPublic').mockResolvedValue([
			[entity],
			1,
		]);

		const response = await request(app).get(basePath);

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
		}, response);
	});

	it('read should answer an unauthenticated caller and consult the access gate', async () => {
		jest.spyOn(articleService, 'resolvePublicRef').mockResolvedValue(
			entity,
		);
		jest.spyOn(articleService, 'getPublicEntryById').mockResolvedValue(
			entity,
		);
		jest.spyOn(articleAccessPolicy, 'assertAccess').mockResolvedValue();

		const response = await request(app).get(`${basePath}/first-article`);

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(articleAccessPolicy.assertAccess).toHaveBeenCalled();
		}, response);
	});

	it('read should surface the access gate rejection', async () => {
		jest.spyOn(articleService, 'resolvePublicRef').mockResolvedValue(
			entity,
		);
		jest.spyOn(articleService, 'getPublicEntryById').mockResolvedValue(
			entity,
		);
		jest.spyOn(articleAccessPolicy, 'assertAccess').mockRejectedValue(
			new UnauthorizedError('nope'),
		);

		const response = await request(app).get(`${basePath}/first-article`);

		withDebugResponse(() => {
			expect(response.status).toBe(401);
		}, response);
	});

	it('read should not consult the visibility rule for a public article', async () => {
		jest.spyOn(articleService, 'resolvePublicRef').mockResolvedValue({
			id: entity.id,
			visibility: ArticleVisibilityEnum.PUBLIC,
		});
		jest.spyOn(articleService, 'getPublicEntryById').mockResolvedValue(
			entity,
		);
		jest.spyOn(articleAccessPolicy, 'assertAccess').mockResolvedValue();

		const findFields = jest.spyOn(
			ArticleVisibilityRuleRepository,
			'findFields',
		);

		await request(app).get(`${basePath}/first-article`);

		expect(findFields).not.toHaveBeenCalled();
	});

	it('read should keep the visibility rule out of the response', async () => {
		// The rule lives under a sibling cache key precisely so it cannot ride along in the
		// payload — the reader being gated must not be handed the gate's configuration
		jest.spyOn(articleService, 'resolvePublicRef').mockResolvedValue({
			id: entity.id,
			visibility: ArticleVisibilityEnum.RESTRICTED,
		});
		jest.spyOn(articleService, 'getPublicEntryById').mockResolvedValue(
			entity,
		);
		jest.spyOn(
			ArticleVisibilityRuleRepository,
			'findFields',
		).mockResolvedValue({
			requires_auth: false,
			requires_subscription: false,
			allowed_countries: ['RO'],
			is_listed: true,
			has_password: true,
		});
		jest.spyOn(articleAccessPolicy, 'assertAccess').mockResolvedValue();

		const response = await request(app).get(`${basePath}/first-article`);

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(JSON.stringify(response.body)).not.toContain(
				'allowed_countries',
			);
			expect(JSON.stringify(response.body)).not.toContain('has_password');
		}, response);
	});

	it('does not share a prefix with the authorized routes', () => {
		// The whole reason these live under their own basePath: a slug must never be
		// dispatched to `/articles/:id`, and no route-ordering rule should be load-bearing
		expect(basePath.startsWith(`${adminBasePath}/`)).toBe(false);
	});

	it('the authorized listing still rejects an unauthenticated caller', async () => {
		const response = await request(app).get(adminBasePath);

		withDebugResponse(() => {
			expect(response.status).toBe(401);
		}, response);
	});
});
