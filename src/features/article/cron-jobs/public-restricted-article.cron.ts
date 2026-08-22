import { ArticleVisibilityEnum } from '@/features/article/article.entity';
import { getArticleRepository } from '@/features/article/article.repository';
import { articleService } from '@/features/article/article.service';

export const SCHEDULE_EXPRESSION = '30 00 * * *';
export const EXPECTED_RUN_TIME = 5; // seconds

/**
 * Lifts the restriction on articles whose `public_at` has arrived (paywall windows, embargoes).
 *
 * Unlike the two status jobs, nothing on the read side second-guesses `visibility`, so this run
 * is the only thing that opens the article up: a `public_at` of 09:00 takes effect at the next
 * daily pass, not at 09:00. Set the date to the day the restriction should end, not the minute.
 *
 * The release is final. `public_at` is cleared and the visibility rule row is soft-deleted, so
 * re-restricting an article means stating the terms again rather than reviving a password and
 * country list nobody has looked at since. `ArticleService.releaseRestricted` does all three
 * writes in one transaction and records the transition in the audit trail.
 */
const publicRestrictedArticle = async () => {
	const entries = await getArticleRepository()
		.createQuery()
		.filterBy('article.visibility', ArticleVisibilityEnum.RESTRICTED)
		.filterByRange('public_at', undefined, new Date())
		.pagination(1, 100)
		.all();

	let released = 0;

	for (const entry of entries) {
		await articleService.releaseRestricted(entry);

		released++;
	}

	return {
		released,
	};
};

export default publicRestrictedArticle;
