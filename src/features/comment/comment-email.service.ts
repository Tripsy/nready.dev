import type CommentEntity from '@/features/comment/comment.entity';
import type CommentSubscriptionEntity from '@/features/comment/comment-subscription.entity';
import { formatDate } from '@/helpers/date.helper';
import { loadEmailTemplate, queueEmail } from '@/providers/email.provider';

/** How much of a comment travels in the digest — enough to recognize, short of reprinting it. */
const EXCERPT_LENGTH = 240;

function excerpt(content: string): string {
	return content.length > EXCERPT_LENGTH
		? `${content.slice(0, EXCERPT_LENGTH).trimEnd()}…`
		: content;
}

/** How a comment is signed in the digest: the account behind it, or the name a guest left. */
function authorName(entry: CommentEntity): string {
	return entry.user?.name ?? entry.guest_name ?? '';
}

export class CommentEmailService {
	/**
	 * One digest per subscriber per run — never one email per comment. A busy discussion would
	 * otherwise arrive as a dozen separate messages, which is what makes people unsubscribe from
	 * notifications rather than from the discussion.
	 *
	 * Written in the subscriber's own language — the one they were reading in when they commented,
	 * carried on the subscription because neither a cron nor a guest has anywhere else to get it.
	 * A language with no template of its own falls back inside `loadEmailTemplate` (and warns),
	 * which is the right way round: an email in the wrong language is an annoyance, no email is a
	 * silent failure.
	 */
	public async sendCommentNotification(
		subscriber: CommentSubscriptionEntity,
		entries: CommentEntity[],
	): Promise<void> {
		const emailTemplate = await loadEmailTemplate(
			'comment-notification',
			subscriber.language,
		);

		emailTemplate.content.vars = {
			name: subscriber.user_name,
			count: entries.length,
			comments: entries.map((entry) => ({
				author: authorName(entry),
				content: excerpt(entry.content),
				created_at: formatDate(entry.created_at, 'date-time') as string,
				/*
				 * The comment's id, not its address. The frontend resolves it to the page the
				 * comment sits on when the link is followed, which is what keeps a link in a
				 * two-year-old inbox working after the article has been re-slugged or re-filed —
				 * and what keeps this feature from having to know that its targets are articles.
				 */
				id: entry.id,
			})),
			// The only credential a guest subscriber holds, and the reason this email is
			// allowed to be sent unprompted — it reaches them here and nowhere else.
			unsubscribe_token: subscriber.unsubscribe_token,
		};

		await queueEmail(emailTemplate, {
			name: subscriber.user_name,
			address: subscriber.user_email,
		});
	}
}

export const commentEmailService = new CommentEmailService();
