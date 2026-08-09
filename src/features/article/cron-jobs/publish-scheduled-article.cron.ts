import { ArticleStatusEnum } from '@/features/article/article.entity';
import { getArticleRepository } from '@/features/article/article.repository';
import { articleService } from '@/features/article/article.service';

export const SCHEDULE_EXPRESSION = '10 00 * * *';
export const EXPECTED_RUN_TIME = 5; // seconds

/**
 * Releases articles whose `publish_at` has arrived.
 *
 * Rows go through `articleService.updateStatus` one at a time rather than a single bulk
 * `UPDATE`: the status transition has to be validated, and the subscribers that invalidate
 * the article cache and write the audit trail only fire on a real save. A bulk update would
 * leave every reader serving the pre-publish copy until its cache entry expired.
 *
 * Daily is enough because `status` is not what gates visibility: `ArticleQuery.filterPublished`
 * evaluates the publish window on every read, so an article released at 09:00 is served from
 * 09:00 whether this job has run. The flip only has to happen for `status` to agree with
 * what readers already see — and for the listing index on (status, publish_at) to stay useful.
 */
const publishScheduledArticle = async () => {
	const entries = await getArticleRepository()
		.createQuery()
		.filterBy('article.status', ArticleStatusEnum.SCHEDULED)
		.filterByRange('publish_at', undefined, new Date())
		.pagination(1, 100)
		.all();

	let published = 0;

	for (const entry of entries) {
		await articleService.updateStatus(entry, ArticleStatusEnum.PUBLISHED);

		published++;
	}

	return {
		published,
	};
};

export default publishScheduledArticle;
