import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import {
	type ComplaintPolicy,
	complaintPolicy,
} from '@/features/complaint/complaint.policy';
import {
	type ComplaintService,
	complaintService,
} from '@/features/complaint/complaint.service';
import { ComplaintValidator } from '@/features/complaint/complaint.validator';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The moderation side. There is no `create` — a complaint is filed by whoever is reading, through
 * the public controller — and no `update`: the text is the reporter's accusation, and a moderator
 * who could rewrite it would be answering a complaint of their own making. What a moderator does
 * here is decide, through `resolveUpdate`.
 */
class ComplaintController extends BaseController {
	constructor(
		private policy: ComplaintPolicy,
		private validator: ComplaintValidator,
		private complaintService: ComplaintService,
	) {
		super();
	}

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const entry = await this.complaintService.getEntryData(
			data.id,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.complaintService.findByFilter(
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

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
	 * The moderation decision, and its reversal — one action each, since the direction is the
	 * endpoint rather than a field in the body.
	 *
	 * `resolved_by` is taken from the authenticated caller, never from the request — `canUpdate`
	 * has already established there is one.
	 */
	private resolutionUpdate(isResolved: boolean) {
		return asyncHandler(async (req: Request, res: Response) => {
			this.policy.canUpdate(res.locals.auth);

			const data = this.validate(
				this.validator.resolveUpdate,
				req.params,
				res,
			);

			const existingEntry = await this.complaintService.findById(data.id);

			await this.complaintService.updateResolution(
				existingEntry,
				isResolved,
				this.policy.getId(res.locals.auth) ?? null,
			);

			res.locals.output.message(
				lang(
					isResolved
						? 'complaint.success.resolve'
						: 'complaint.success.reopen',
				),
			);

			res.json(res.locals.output);
		});
	}

	public resolve = this.resolutionUpdate(true);

	public reopen = this.resolutionUpdate(false);

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.complaintService.delete(data.id);

		res.locals.output.message(lang('complaint.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.complaintService.restore(data.id);

		res.locals.output.message(lang('complaint.success.restore'));

		res.json(res.locals.output);
	});
}

export const complaintController = new ComplaintController(
	complaintPolicy,
	new ComplaintValidator('complaint'),
	complaintService,
);
