import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import {
	type CommentPolicy,
	commentPolicy,
} from '@/features/comment/comment.policy';
import {
	type CommentService,
	commentService,
} from '@/features/comment/comment.service';
import { CommentValidator } from '@/features/comment/comment.validator';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The moderation side. There is no `create` — a comment is written by whoever is reading, through
 * the public controller — and no `restore`, since the table has no `deleted_at` and a removed
 * comment is gone.
 */
class CommentController extends BaseController {
	constructor(
		private policy: CommentPolicy,
		private validator: CommentValidator,
		private commentService: CommentService,
	) {
		super();
	}

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const entry = await this.commentService.getEntryData(data.id);

		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.update,
			{
				...req.body,
				id: req.params.id,
			},
			res,
		);

		const existingEntry = await this.commentService.findById(data.id);

		const entry = await this.commentService.updateData(existingEntry, data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('comment.success.update'));

		res.json(res.locals.output);
	});

	/**
	 * Hard, and it takes the replies with it: `parent_id` cascades, so a comment cannot be removed
	 * while leaving a thread hanging off it. See `CommentService.removeSubtree`.
	 */
	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.commentService.delete(data.id);

		res.locals.output.message(lang('comment.success.delete'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.commentService.findByFilter(data);

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

	/**
	 * The moderation decision. `moderated_by` is taken from the authenticated caller, never from
	 * the request — `canUpdate` has already established there is one.
	 */
	public statusUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.statusUpdate,
			{
				...req.body,
				...req.params,
			},
			res,
		);

		const existingEntry = await this.commentService.findById(data.id);

		await this.commentService.updateStatus(
			existingEntry,
			data.status,
			this.policy.getId(res.locals.auth) ?? null,
			data.moderation_reason,
		);

		res.locals.output.message(lang('comment.success.status_update'));

		res.json(res.locals.output);
	});
}

export const commentController = new CommentController(
	commentPolicy,
	new CommentValidator('comment'),
	commentService,
);
