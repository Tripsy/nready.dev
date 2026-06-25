import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import {
	type LogHistoryPolicy,
	logHistoryPolicy,
} from '@/features/log-history/log-history.policy';
import {
	type LogHistoryService,
	logHistoryService,
} from '@/features/log-history/log-history.service';
import {
	type LogHistoryValidator,
	logHistoryValidator,
} from '@/features/log-history/log-history.validator';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class LogHistoryController extends BaseController {
	constructor(
		private policy: LogHistoryPolicy,
		private validator: LogHistoryValidator,
		private logHistoryService: LogHistoryService,
	) {
		super();
	}

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const entry = await logHistoryService.findById(data.id);

		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.body, res);

		const countDelete = await this.logHistoryService.delete(data);

		if (countDelete === 0) {
			res.status(409).locals.output.message(
				lang('shared.error.db_delete_zero'),
			); // Note: By API design the response message is actually not displayed for 204
		} else {
			res.locals.output.message(lang('log-history.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] =
			await this.logHistoryService.findByFilter(data);

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

export const logHistoryController = new LogHistoryController(
	logHistoryPolicy,
	logHistoryValidator,
	logHistoryService,
);
