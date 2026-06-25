import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import CronHistoryEntity from '@/features/cron-history/cron-history.entity';
import {
	type CronHistoryPolicy,
	cronHistoryPolicy,
} from '@/features/cron-history/cron-history.policy';
import {
	type CronHistoryService,
	cronHistoryService,
} from '@/features/cron-history/cron-history.service';
import {
	type CronHistoryValidator,
	cronHistoryValidator,
} from '@/features/cron-history/cron-history.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class CronHistoryController extends BaseController {
	constructor(
		private policy: CronHistoryPolicy,
		private validator: CronHistoryValidator,
		private cache: CacheProvider,
		private cronHistoryService: CronHistoryService,
	) {
		super();
	}

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const cacheKey = this.cache.buildKey(
			CronHistoryEntity.NAME,
			data.id.toString(),
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.cronHistoryService.findById(data.id),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.body, res);

		const countDelete = await this.cronHistoryService.delete(data);

		if (countDelete === 0) {
			res.status(409).locals.output.message(
				lang('shared.error.db_delete_zero'),
			); // Note: By API design the response message is actually not displayed for 204
		} else {
			res.locals.output.message(lang('cron-history.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] =
			await this.cronHistoryService.findByFilter(data);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: data.page,
				limit: data.limit,
				total: total,
			},
			query: data,
		});

		res.json(res.locals.output);
	});
}

export const cronHistoryController = new CronHistoryController(
	cronHistoryPolicy,
	cronHistoryValidator,
	cacheProvider,
	cronHistoryService,
);
