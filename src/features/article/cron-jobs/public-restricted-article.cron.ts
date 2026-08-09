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
 * `public_at` is deliberately left in place: the flip to `public` is what takes the row out of
 * this query, and the date stays as a record of when the restriction ended. Clearing it would
 * erase that for no gain.
 *
 * The visibility rule row is left alone too — an article that goes public keeps its rule so a
 * later re-restriction does not have to be reconstructed from scratch. `visibility` is the
 * switch; the rule is only consulted while it reads `restricted`.
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
		entry.visibility = ArticleVisibilityEnum.PUBLIC;

		await articleService.update(entry);

		released++;
	}

	return {
		released,
	};
};

export default publicRestrictedArticle;
