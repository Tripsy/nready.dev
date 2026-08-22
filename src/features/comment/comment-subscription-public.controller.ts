import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import {
	type CommentSubscriptionService,
	commentSubscriptionService,
} from '@/features/comment/comment-subscription.service';
import { CommentSubscriptionValidator } from '@/features/comment/comment-subscription.validator';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The unsubscribe landing, reached from a link in a notification email.
 *
 * No session and no permission: a guest subscriber has neither, and requiring an account to stop
 * unsolicited email would be requiring an account to withdraw consent. The token in the path is
 * the credential — 32 random bytes, unique, and delivered only in the email it came with.
 *
 * A wrong token is a 404 from `firstOrFail`, which is the right answer: there is nothing to tell
 * the holder of a token about a row it does not open.
 */
class CommentSubscriptionPublicController extends BaseController {
	constructor(
		private validator: CommentSubscriptionValidator,
		private commentSubscriptionService: CommentSubscriptionService,
	) {
		super();
	}

	/**
	 * What the reader is deciding about. The address is echoed back so they can see which of
	 * their addresses is subscribed — it is one they already hold, having received the email at
	 * it, so this tells the holder of the token nothing they did not have.
	 */
	public read = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(this.validator.publicRead, req.params, res);

		const entry = await this.commentSubscriptionService.findByToken(
			data.token,
		);

		res.locals.output.data({
			entity_type: entry.entity_type,
			entity_id: entry.entity_id,
			user_email: entry.user_email,
			language: entry.language,
			notification_type: entry.notification_type,
		});

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(
			this.validator.publicUpdate,
			{ ...req.body, ...req.params },
			res,
		);

		const entry = await this.commentSubscriptionService.updateType(
			data.token,
			data.notification_type,
		);

		res.locals.output.data({
			notification_type: entry.notification_type,
		});
		res.locals.output.message(lang('comment.success.subscription_update'));

		res.json(res.locals.output);
	});
}

export const commentSubscriptionPublicController =
	new CommentSubscriptionPublicController(
		new CommentSubscriptionValidator('comment'),
		commentSubscriptionService,
	);
