import { z } from 'zod';
import { CommentSubscriptionTypeEnum } from '@/features/comment/comment-subscription.entity';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

/**
 * The token is 32 random bytes as hex, so its length is fixed and known — checking it here turns a
 * truncated link into a 422 with a message instead of a lookup that finds nothing.
 */
export const UNSUBSCRIBE_TOKEN_LENGTH = 64;

const validatorMessages = [
	'invalid_token',
	'invalid_notification_type',
] as const;

export class CommentSubscriptionValidator extends BaseValidator<
	typeof validatorMessages
> {
	private tokenSchema() {
		return {
			token: this.validateString(this.getMessage('invalid_token'), {
				minChars: UNSUBSCRIBE_TOKEN_LENGTH,
				maxChars: UNSUBSCRIBE_TOKEN_LENGTH,
			}),
		};
	}

	/** What the landing page shows before the reader decides anything. */
	readonly publicRead = z.object(this.tokenSchema());

	/**
	 * Both directions of the choice, including opting out — `unsubscribed` is one of the three
	 * values, not a separate endpoint, because it is a state the row keeps rather than a deletion.
	 */
	readonly publicUpdate = z.object({
		...this.tokenSchema(),

		notification_type: this.validateEnum(
			CommentSubscriptionTypeEnum,
			this.getMessage('invalid_notification_type'),
		),
	});
}
