import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import {
	type RatingPolicy,
	ratingPolicy,
} from '@/features/rating/rating.policy';
import {
	type RatingService,
	ratingService,
} from '@/features/rating/rating.service';
import { RatingValidator } from '@/features/rating/rating.validator';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The dashboard side: read what was cast and remove it. There is no `create` and no `update` —
 * a rating is cast by the reader who owns it, and the table is insert-only, so the only write a
 * moderator has is the removal of a row that should not stand.
 */
class RatingController extends BaseController {
	constructor(
		private policy: RatingPolicy,
		private validator: RatingValidator,
		private ratingService: RatingService,
	) {
		super();
	}

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const entry = await this.ratingService.getEntryData(data.id);

		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.ratingService.delete(data.id);

		res.locals.output.message(lang('rating.success.delete'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.ratingService.findByFilter(data);

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

export const ratingController = new RatingController(
	ratingPolicy,
	new RatingValidator('rating'),
	ratingService,
);
