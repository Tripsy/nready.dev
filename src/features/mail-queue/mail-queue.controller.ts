import type { Request, Response } from 'express';
import { eventEmitter } from '@/config/event.config';
import { lang } from '@/config/i18n.setup';
import MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import {
	type MailQueuePolicy,
	mailQueuePolicy,
} from '@/features/mail-queue/mail-queue.policy';
import {
	type MailQueueService,
	mailQueueService,
} from '@/features/mail-queue/mail-queue.service';
import { MailQueueValidator } from '@/features/mail-queue/mail-queue.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';
import { LogHistoryActionEnum } from '@/shared/types/log-history.type';

class MailQueueController extends BaseController {
	constructor(
		private policy: MailQueuePolicy,
		private validator: MailQueueValidator,
		private cache: CacheProvider,
		private mailQueueService: MailQueueService,
	) {
		super();
	}

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const cacheKey = this.cache.buildKey(
			MailQueueEntity.NAME,
			data.id.toString(),
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.mailQueueService.findById(data.id),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.body, res);

		const countDelete = await this.mailQueueService.delete(data);

		if (countDelete === 0) {
			res.status(409).locals.output.message(
				lang('shared.error.db_delete_zero'),
			); // Note: By API design the response message is actually not displayed for 204
		} else {
			eventEmitter.emit('history', {
				entity: MailQueueEntity.NAME,
				entity_ids: data.ids,
				action: LogHistoryActionEnum.DELETED,
			});

			res.locals.output.message(lang('mail-queue.success.delete'));
		}

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.mailQueueService.findByFilter(data);

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

export const mailQueueController = new MailQueueController(
	mailQueuePolicy,
	new MailQueueValidator('mail-queue'),
	cacheProvider,
	mailQueueService,
);
