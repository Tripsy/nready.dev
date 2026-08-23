import type { Request, Response } from 'express';
import { CashFlowDirectionEnum } from '@/features/cash-flow/cash-flow.entity';
import { type StatsPolicy, statsPolicy } from '@/features/stats/stats.policy';
import {
	type StatsService,
	statsService,
} from '@/features/stats/stats.service';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

// Dashboard tiles are read on every page load and the underlying figures move slowly, so each
// endpoint is cached; the TTL is the longest staleness the tile can show.
// Seconds — `cacheProvider.set` passes this straight to Redis `EX`.
const CACHE_TTL = 20 * 60;

class StatsController extends BaseController {
	constructor(
		private cache: CacheProvider,
		private policy: StatsPolicy,
		private statsService: StatsService,
	) {
		super();
	}

	public recentActivity = asyncHandler(
		async (_req: Request, res: Response) => {
			this.policy.seeStats(res.locals.auth);

			const cacheKey = this.cache.buildKey('stats', 'recent-activity');

			const cacheGetResults = await this.cache.get(
				cacheKey,
				() => this.statsService.getRecentActivity(),
				CACHE_TTL,
			);

			res.locals.output.meta(cacheGetResults.isCached, 'isCached');
			res.locals.output.data(cacheGetResults.data);

			res.json(res.locals.output);
		},
	);

	public recentCounts = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.seeStats(res.locals.auth);

		const cacheKey = this.cache.buildKey('stats', 'recent-counts');

		const cacheGetResults = await this.cache.get(
			cacheKey,
			() => this.statsService.getRecentCounts(),
			CACHE_TTL,
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public pendingReview = asyncHandler(
		async (_req: Request, res: Response) => {
			this.policy.seeStats(res.locals.auth);

			const cacheKey = this.cache.buildKey('stats', 'pending-review');

			const cacheGetResults = await this.cache.get(
				cacheKey,
				() => this.statsService.getPendingReview(),
				CACHE_TTL,
			);

			res.locals.output.meta(cacheGetResults.isCached, 'isCached');
			res.locals.output.data(cacheGetResults.data);

			res.json(res.locals.output);
		},
	);

	public sumExpenses = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.seeStats(res.locals.auth);

		const cacheKey = this.cache.buildKey('stats', 'sum-expenses');

		const cacheGetResults = await this.cache.get(
			cacheKey,
			() => this.statsService.getSumAmount(CashFlowDirectionEnum.OUT),
			CACHE_TTL,
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public sumRevenues = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.seeStats(res.locals.auth);

		const cacheKey = this.cache.buildKey('stats', 'sum-revenues');

		const cacheGetResults = await this.cache.get(
			cacheKey,
			() => this.statsService.getSumAmount(CashFlowDirectionEnum.IN),
			CACHE_TTL,
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});
}

export const statsController = new StatsController(
	cacheProvider,
	statsPolicy,
	statsService,
);
