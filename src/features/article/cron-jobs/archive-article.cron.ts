import { ArticleStatusEnum } from '@/features/article/article.entity';
import { getArticleRepository } from '@/features/article/article.repository';
import { articleService } from '@/features/article/article.service';

export const SCHEDULE_EXPRESSION = '20 00 * * *';
export const EXPECTED_RUN_TIME = 5; // seconds

/**
 * Retires published articles whose `archive_at` deadline has passed.
 *
 * Daily: an expiry is editorial housekeeping, and the read side already stops serving the
 * article the moment the deadline passes (`ArticleQuery.filterPublished`), so the lag between
 * the deadline and the flip are invisible to a reader.
 *
 * Saved row by row through the service so the status transition is validated and the cache /
 * audit subscribers fire — see `publish-scheduled-article.cron.ts`.
 */
const archiveArticle = async () => {
	const entries = await getArticleRepository()
		.createQuery()
		.filterBy('article.status', ArticleStatusEnum.PUBLISHED)
		.filterByRange('archive_at', undefined, new Date())
		.pagination(1, 100)
		.all();

	let archived = 0;

	for (const entry of entries) {
		await articleService.updateStatus(entry, ArticleStatusEnum.ARCHIVED);

		archived++;
	}

	return {
		archived,
	};
};

export default archiveArticle;
