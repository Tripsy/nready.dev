import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import LogDataEntity from '@/features/log-data/log-data.entity';
import {
	type LogDataPolicy,
	logDataPolicy,
} from '@/features/log-data/log-data.policy';
import {
	type LogDataService,
	logDataService,
} from '@/features/log-data/log-data.service';
import { LogDataValidator } from '@/features/log-data/log-data.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class LogDataController extends BaseController {
	constructor(
		private policy: LogDataPolicy,
		private validator: LogDataValidator,
		private cache: CacheProvider,
		private logDataService: LogDataService,
	) {
		super();
	}

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const cacheKey = this.cache.buildKey(
			LogDataEntity.NAME,
			data.id.toString(),
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.logDataService.findById(data.id),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.body, res);

		const countDelete = await this.logDataService.delete(data);

		if (countDelete === 0) {
			res.status(409).locals.output.message(
				lang('shared.error.db_delete_zero'),
			); // Note: By API design the response message is actually not displayed for 204
		} else {
			res.locals.output.message(lang('log-data.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.logDataService.findByFilter(data);

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

export const logDataController = new LogDataController(
	logDataPolicy,
	new LogDataValidator('log-data'),
	cacheProvider,
	logDataService,
);
