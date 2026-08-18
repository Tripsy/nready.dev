import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import { BadRequestError } from '@/exceptions';
import {
	type RatingPolicy,
	ratingPolicy,
} from '@/features/rating/rating.policy';
import type { RatingOwner } from '@/features/rating/rating.service';
import {
	type RatingService,
	ratingService,
} from '@/features/rating/rating.service';
import { RatingValidator } from '@/features/rating/rating.validator';
import asyncHandler from '@/helpers/async.handler';
import { hashClientIp } from '@/helpers/security.helper';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The reader-facing side. Every action here is open to guests — rating is what an anonymous
 * visitor does — so authorization is not a permission check but an identity: `resolveOwner`
 * decides which rows the request may speak for, and both the write and the withdrawal are scoped
 * to those.
 */
class RatingPublicController extends BaseController {
	constructor(
		private policy: RatingPolicy,
		private validator: RatingValidator,
		private ratingService: RatingService,
	) {
		super();
	}

	/**
	 * Who the request counts as. The address hash is always required,
	 * so a request whose origin cannot be resolved is rejected here rather than stored under a
	 * shared fallback — see `hashClientIp` and the entity.
	 *
	 * 400 rather than 500: it is the deployment's proxy configuration that decides whether an
	 * address arrives, so this is a fact about the request, and a 5xx message would be masked
	 * before it reached anyone who could act on it.
	 */
	private resolveOwner(req: Request, res: Response): RatingOwner {
		const userIpHash = hashClientIp(req);

		if (!userIpHash) {
			throw new BadRequestError(lang('rating.error.ip_unresolved'));
		}

		return {
			user_id: this.policy.getId(res.locals.auth) || null,
			user_ip_hash: userIpHash,
		};
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.ratingService.create(
			data,
			this.resolveOwner(req, res),
		);

		res.locals.output.data(entry);
		res.locals.output.message(lang('rating.success.create'));

		res.status(201).json(res.locals.output);
	});

	/**
	 * Changing a rating already cast. The target and `type` come from the params — they address
	 * the row and are not editable — while the body carries the new `value` / `reaction`, so the
	 * two are merged into the one schema that validates a rating of that type. Params are spread
	 * last on purpose: a body naming a different target would otherwise redirect the write to a
	 * row the path never authorised.
	 *
	 * Separate from `create` rather than folded into an upsert: `create`'s 409 distinguishes the
	 * caller's own earlier rating from one cast by somebody else behind the same address, and an
	 * upsert would have to answer both the same way.
	 */
	public update = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(
			this.validator.update,
			{ ...req.body, ...req.params },
			res,
		);

		const entry = await this.ratingService.updateOwn(
			data,
			this.resolveOwner(req, res),
		);

		res.locals.output.data(entry);
		res.locals.output.message(lang('rating.success.update'));

		res.json(res.locals.output);
	});

	/**
	 * Withdrawing a rating — the reader takes it back entirely. Changing one's mind about the
	 * score goes through `update` instead and keeps the row.
	 */
	public delete = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(
			this.validator.publicDelete,
			req.params,
			res,
		);

		await this.ratingService.deleteOwn(data, this.resolveOwner(req, res));

		res.locals.output.message(lang('rating.success.delete'));

		res.json(res.locals.output);
	});

	/**
	 * The aggregate for one target, plus what this caller cast on it — the two halves a rating
	 * widget renders at once, so they are resolved together rather than over two round trips.
	 *
	 * Not cached: `RatingEntity.HAS_CACHE` is false, and a cached count is the one thing a reader
	 * notices immediately after voting.
	 */
	public read = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(this.validator.publicRead, req.params, res);

		const summary = await this.ratingService.getSummary(data);

		res.locals.output.data({
			summary: summary,
			own: await this.ratingService.getOwnRatings(
				data,
				this.resolveOwner(req, res),
			),
		});

		res.json(res.locals.output);
	});
}

export const ratingPublicController = new RatingPublicController(
	ratingPolicy,
	new RatingValidator('rating'),
	ratingService,
);
