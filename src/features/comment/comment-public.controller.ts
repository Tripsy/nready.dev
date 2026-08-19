import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import { BadRequestError } from '@/exceptions';
import CommentEntity from '@/features/comment/comment.entity';
import {
	type CommentPolicy,
	commentPolicy,
} from '@/features/comment/comment.policy';
import type { CommentAuthor } from '@/features/comment/comment.service';
import {
	type CommentService,
	commentService,
} from '@/features/comment/comment.service';
import { CommentValidator } from '@/features/comment/comment.validator';
import asyncHandler from '@/helpers/async.handler';
import { hashClientIp } from '@/helpers/security.helper';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The reader-facing side. Every action here is open to guests — commenting is what an anonymous
 * visitor does — so authorization is not a permission check but an identity: `resolveAuthor`
 * decides which rows the request may speak for, and both the edit and the withdrawal are scoped to
 * those.
 */
class CommentPublicController extends BaseController {
	constructor(
		private policy: CommentPolicy,
		private validator: CommentValidator,
		private cache: CacheProvider,
		private commentService: CommentService,
	) {
		super();
	}

	/**
	 * Who the request counts as. The address hash is always required, so a request whose origin
	 * cannot be resolved is rejected here rather than stored under a shared fallback — every
	 * unresolvable visitor would hash alike, and a guest's only handle on their own comment is
	 * exactly that hash.
	 *
	 * 400 rather than 500: it is the deployment's proxy configuration that decides whether an
	 * address arrives, so this is a fact about the request, and a 5xx message would be masked
	 * before it reached anyone who could act on it.
	 */
	private resolveAuthor(req: Request, res: Response): CommentAuthor {
		const userIpHash = hashClientIp(req);

		if (!userIpHash) {
			throw new BadRequestError(lang('comment.error.ip_unresolved'));
		}

		return {
			user_id: this.policy.getId(res.locals.auth) || null,
			user_ip_hash: userIpHash,
			is_staff: this.policy.isAdmin(res.locals.auth),
		};
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.commentService.create(
			data,
			this.resolveAuthor(req, res),
		);

		res.locals.output.data(this.commentService.toPublicView(entry));
		res.locals.output.message(lang('comment.success.create'));

		res.status(201).json(res.locals.output);
	});

	/**
	 * Editing one's own comment, while it is still awaiting moderation. Addressed by id — unlike a
	 * rating, an author may hold many comments on one target, so nothing shorter names the row —
	 * and the ownership check is part of the query that loads it, not a step after.
	 */
	public update = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(
			this.validator.publicUpdate,
			{
				...req.body,
				id: req.params.id,
			},
			res,
		);

		const entry = await this.commentService.updateOwn(
			data,
			this.resolveAuthor(req, res),
		);

		res.locals.output.data(this.commentService.toPublicView(entry));
		res.locals.output.message(lang('comment.success.update'));

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(
			this.validator.publicDelete,
			req.params,
			res,
		);

		await this.commentService.deleteOwn(data, this.resolveAuthor(req, res));

		res.locals.output.message(lang('comment.success.delete'));

		res.json(res.locals.output);
	});

	/**
	 * One level of a thread, approved rows only.
	 *
	 * Cached, and safely so: a new comment lands as `pending` and changes nothing here, while every
	 * write that *does* change what a reader sees — an approval, an edit, a removal — drops the
	 * whole target's keys through `CommentService.cleanThreadCache`. The key carries everything the
	 * query varies by, so two pages of one thread cannot collide.
	 */
	public find = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(
			this.validator.publicFind,
			{ ...req.query, ...req.params },
			res,
		);

		const cacheKey = this.cache.buildKey(
			CommentEntity.NAME,
			data.entity_type,
			data.entity_id.toString(),
			data.filter.parent_id?.toString() ?? 'roots',
			data.filter.type ?? 'all-types',
			`${data.order_by}-${data.direction}`,
			`${data.page}-${data.limit}`,
		);

		// The whole payload is built inside the loader, pagination included: it is what gets
		// stored, so a cache hit and a miss return the same object rather than one assembled
		// differently on each path.
		const cacheGetResults = await this.cache.get(cacheKey, async () => {
			const [entries, total] = await this.commentService.findPublic(data);

			return {
				entries: entries,
				pagination: {
					page: data.page,
					limit: data.limit,
					total: total,
				},
				/*
				 * Only when reading the roots: a thread shows its first reply straight away, and
				 * this is what spares the client one request per root to find it. A reply list is
				 * already the replies, so it needs nothing further.
				 */
				first_replies: data.filter.parent_id
					? {}
					: await this.commentService.findFirstReplies(
							entries
								.filter((entry) => entry.reply_count > 0)
								.map((entry) => entry.id),
						),
			};
		});

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});
}

export const commentPublicController = new CommentPublicController(
	commentPolicy,
	new CommentValidator('comment'),
	cacheProvider,
	commentService,
);
