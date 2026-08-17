/**
 * Reports articles that carry no article-type category.
 *
 * The public site addresses an article as `/articles/<category>/<slug>`, so one filed under
 * nothing (or only under a product category) has no canonical URL and renders without a
 * chip. `ArticleValidator` now refuses to create such a row, but that rule cannot reach the
 * ones already stored — this is how they are found.
 *
 * Usage: npx tsx cli/check-article-categories.ts [--fix]
 *   --fix  assigns each offender the article category with the fewest articles, so the
 *          repair spreads rather than piling everything onto one.
 *
 * Exits non-zero when offenders remain, so it can gate a deploy.
 */
import dataSource from '@/config/data-source.config';
import ArticleEntity from '@/features/article/article.entity';
import ArticleCategoryEntity from '@/features/article/article-category.entity';
import CategoryEntity, {
	CategoryTypeEnum,
} from '@/features/category/category.entity';

const shouldFix = process.argv.includes('--fix');

await dataSource.initialize();

try {
	const articleRepository = dataSource.getRepository(ArticleEntity);
	const linkRepository = dataSource.getRepository(ArticleCategoryEntity);
	const categoryRepository = dataSource.getRepository(CategoryEntity);

	// A link to a product category does not count: the article site has no page for it.
	const findOffenders = () =>
		articleRepository
			.createQueryBuilder('article')
			.leftJoin(
				ArticleCategoryEntity,
				'link',
				'link.article_id = article.id AND link.deleted_at IS NULL',
			)
			.leftJoin(
				CategoryEntity,
				'category',
				'category.id = link.category_id AND category.type = :type',
				{ type: CategoryTypeEnum.ARTICLE },
			)
			.where('article.deleted_at IS NULL')
			.groupBy('article.id')
			.having('COUNT(category.id) = 0')
			.select(['article.id'])
			.getMany();

	let offenders = await findOffenders();

	if (offenders.length && shouldFix) {
		const categories = await categoryRepository
			.createQueryBuilder('category')
			.leftJoin(
				ArticleCategoryEntity,
				'link',
				'link.category_id = category.id AND link.deleted_at IS NULL',
			)
			.where('category.type = :type', { type: CategoryTypeEnum.ARTICLE })
			.groupBy('category.id')
			.orderBy('COUNT(link.id)', 'ASC')
			.select(['category.id'])
			.getMany();

		if (!categories.length) {
			throw new Error(
				'No article category exists to file articles under',
			);
		}

		for (const [index, article] of offenders.entries()) {
			await linkRepository.save(
				linkRepository.create({
					article_id: article.id,
					category_id: categories[index % categories.length].id,
				}),
			);
		}

		console.log(`Filed ${offenders.length} article(s) under a category.`);

		offenders = await findOffenders();
	}

	if (offenders.length) {
		console.error(
			`${offenders.length} article(s) without an article category: ${offenders
				.map((article) => article.id)
				.join(', ')}`,
		);
		process.exitCode = 1;
	} else {
		console.log('Every article carries an article category.');
	}
} finally {
	await dataSource.destroy();
}
