import { getArticleRepository } from '@/features/article/article.repository';
import { articleService } from '@/features/article/article.service';

export const SCHEDULE_EXPRESSION = '40 00 * * *';
export const EXPECTED_RUN_TIME = 5; // seconds

/**
 * Drops articles out of their featured group once `featured_expire_at` has passed.
 *
 * Like `public-restricted-article`, this run is the mechanism rather than a tidy-up: nothing on
 * the read side evaluates `featured_expire_at`, so an article stays on the homepage until this
 * job clears the flag. Set the date to the day the placement should end, not the minute.
 *
 * Rows go through `ArticleService.expireFeatured` one at a time — it clears the slot, the order
 * position and the deadline together, and records which group was given up in the audit trail.
 */
const expireFeaturedArticle = async () => {
	const entries = await getArticleRepository()
		.createQuery()
		.filterRaw('article.featured_status IS NOT NULL')
		.filterByRange('featured_expire_at', undefined, new Date())
		.pagination(1, 100)
		.all();

	let expired = 0;

	for (const entry of entries) {
		await articleService.expireFeatured(entry);

		expired++;
	}

	return {
		expired,
	};
};

export default expireFeaturedArticle;
