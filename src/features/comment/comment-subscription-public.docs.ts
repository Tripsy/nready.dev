import { CommentEntityTypeEnum } from '@/features/comment/comment.entity';
import { CommentSubscriptionTypeEnum } from '@/features/comment/comment-subscription.entity';
import { UNSUBSCRIBE_TOKEN_LENGTH } from '@/features/comment/comment-subscription.validator';
import type { commentSubscriptionPublicController } from '@/features/comment/comment-subscription-public.controller';
import {
	type ApiInputDocumentation,
	helperApiInputDocumentation,
} from '@/helpers/api-documentation.helper';

/**
 * The unsubscribe landing page's API, mounted under `/public/comment-subscriptions`. A route
 * module of its own inside the comment feature, and the third one it documents.
 *
 * Addressed by token rather than by id: a guest subscriber holds no session, so the token is both
 * the address of the row and the only credential its holder has.
 */
const tokenParam = {
	type: 'string' as const,
	required: true,
	condition: `exactly ${UNSUBSCRIBE_TOKEN_LENGTH} characters — the hex form of the 32 random bytes carried in the notification link; a truncated link answers 422 rather than a lookup that finds nothing`,
};

export const docs: Record<
	keyof typeof commentSubscriptionPublicController,
	ApiInputDocumentation
> = {
	read: helperApiInputDocumentation({
		description: 'Read the subscription behind an unsubscribe link',
		success: {
			status: 200,
			description: 'Subscription details',
			dataSample: {
				entity_type: CommentEntityTypeEnum.ARTICLE,
				entity_id: 4,
				user_email: 'ana@example.com',
				language: 'en',
				notification_type: CommentSubscriptionTypeEnum.ALL,
			},
		},
		withErrors: [404, 422],
		request: {
			notes: 'The address is echoed back so the reader can see which of theirs is subscribed — it is one they already hold, having received the mail at it',
			params: {
				token: tokenParam,
			},
		},
	}),
	update: helperApiInputDocumentation({
		description: 'Change what the subscriber is notified about',
		success: {
			status: 200,
			description: 'Subscription updated successfully',
			dataSample: {
				notification_type: CommentSubscriptionTypeEnum.UNSUBSCRIBED,
			},
		},
		withErrors: [404, 422],
		request: {
			notes: `Opting out is one of the values, not a separate endpoint: ${CommentSubscriptionTypeEnum.UNSUBSCRIBED} is a state the row keeps. Deleting it instead would re-subscribe the reader with their next comment, since commenting is what creates the subscription`,
			params: {
				token: tokenParam,
			},
			body: {
				notification_type: {
					type: 'enum',
					required: true,
					values: Object.values(CommentSubscriptionTypeEnum),
				},
			},
			sample: {
				notification_type: CommentSubscriptionTypeEnum.REPLIES_TO_ME,
			},
		},
	}),
};
