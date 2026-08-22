import { getCommentSubscriptionRepository } from '@/features/comment/comment-subscription.repository';
import { createPastDate } from '@/helpers/date.helper';

export const SCHEDULE_EXPRESSION = '37 04 * * *';
export const EXPECTED_RUN_TIME = 5; // seconds

/*
 * Retention for the subscription table, which nothing else bounds: a row is written for every
 * person who comments anywhere, and only a hard-deleted target (`comment.listener.ts`) ever
 * clears one.
 *
 * 60 days from `created_at`, which is when the subscriber first commented on that discussion —
 * the conflict path refreshes `language` and nothing else, so a later comment on the same target
 * does not extend the window. A reader who is still following a discussion two months on is
 * re-subscribed by their next comment, at `all`.
 *
 * `unsubscribed` rows go too, which is the one thing to understand before changing the window.
 * Elsewhere the opt-out *is* the row — `subscribe()` is insert-or-update precisely so a later
 * comment cannot re-subscribe somebody who asked to be left alone. Purging it gives that up
 * deliberately: after 60 days of silence the discussion is over for that reader, and if they
 * return and comment on it again, that is fresh intent rather than the old opt-out being
 * overridden. Shorten the window and this stops being true.
 *
 * Daily at :37, offset from the other cleanup jobs — they share a database, and simultaneous
 * bulk deletes are a self-inflicted latency spike.
 */
const cleanCommentSubscription = async () => {
	const countRemoved = await getCommentSubscriptionRepository()
		.createQuery()
		.filterByRange('created_at', undefined, createPastDate(86400 * 60)) // older than 60 days
		.delete(false, true, true);

	return {
		removed: countRemoved,
	};
};

export default cleanCommentSubscription;
