import {
	isDirectRun,
	loadIds,
	randomInt,
	randomPastDate,
	randomPick,
	type SeedDefinition,
	type SeedSummary,
	sequenceLabel,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import ArticleEntity, {
	ArticleFeaturedStatusEnum,
	ArticleLayoutEnum,
	ArticleSourceModeEnum,
	ArticleStatusEnum,
	ArticleVisibilityEnum,
} from '@/features/article/article.entity';
import ArticleCategoryEntity from '@/features/article/article-category.entity';
import ArticleContentEntity from '@/features/article/article-content.entity';
import ArticleTagEntity from '@/features/article/article-tag.entity';
import CategoryEntity from '@/features/category/category.entity';
import TermEntity, { TermTypeEnum } from '@/features/term/term.entity';
import UserEntity from '@/features/user/user.entity';

const TARGET = 12;

const TITLES: readonly string[] = [
	'Choosing a laptop that lasts',
	'Five accessories worth the desk space',
	'How we test battery life',
	'A short guide to mechanical keyboards',
	'What changed in this year’s monitors',
	'Cable management without the clutter',
	'Picking a printer you will not resent',
	'The case for a second screen',
	'Storage: fast, large, or cheap',
	'Headphones for an open office',
	'Webcams that survive daylight',
	'Keeping a workstation quiet',
];

/**
 * The seed spreads articles across the status enum on purpose: `scheduled` and `archived`
 * rows are what make the publish window, the cron transitions and the listing indexes
 * observable without hand-editing the database.
 */
export const articleSeed: SeedDefinition = {
	name: 'article',
	run: async ({ manager, random }): Promise<SeedSummary> => {
		const articleRepository = manager.getRepository(ArticleEntity);
		const contentRepository = manager.getRepository(ArticleContentEntity);
		const categoryLinkRepository = manager.getRepository(
			ArticleCategoryEntity,
		);
		const tagLinkRepository = manager.getRepository(ArticleTagEntity);

		const categoryIds = await loadIds(manager, CategoryEntity);
		// The type alone identifies a tag: a term is language-neutral, and its wording lives in
		// `term_content`, so there is no longer a language to narrow by here
		const tagIds = await loadIds(manager, TermEntity, {
			type: TermTypeEnum.TAG,
		});
		const userIds = await loadIds(manager, UserEntity);

		// The slug lives on the content row, so that is where the natural key is read from
		const existingContent = await contentRepository.find({
			select: { slug: true },
		});

		const existingSlugs = new Set(
			existingContent.map((content) => content.slug),
		);

		let alreadyPresent = 0;
		let inserted = 0;

		for (let index = 0; index < TARGET; index++) {
			const slug = `article-${sequenceLabel(index)}`;

			if (existingSlugs.has(slug)) {
				alreadyPresent++;
				continue;
			}

			const status = randomPick(random, [
				ArticleStatusEnum.DRAFT,
				ArticleStatusEnum.PENDING,
				ArticleStatusEnum.SCHEDULED,
				ArticleStatusEnum.PUBLISHED,
				ArticleStatusEnum.PUBLISHED,
				ArticleStatusEnum.ARCHIVED,
			]);

			const isScheduled = status === ArticleStatusEnum.SCHEDULED;

			const article = await articleRepository.save(
				articleRepository.create({
					status,
					layout: ArticleLayoutEnum.DEFAULT,
					// A scheduled article is due in the future; a published one is already out
					publish_at: isScheduled
						? new Date(
								Date.now() +
									randomInt(random, 1, 30) * 86400 * 1000,
							)
						: randomPastDate(random, 120),
					archive_at: null,
					featured_status:
						index < 2 ? ArticleFeaturedStatusEnum.SECTION : null,
					featured_order: index < 2 ? (index + 1) * 10 : 0,
					visibility: ArticleVisibilityEnum.PUBLIC,
					source_mode: ArticleSourceModeEnum.INPUT,
					author_id: userIds.length
						? randomPick(random, userIds)
						: null,
				}),
			);

			const title = TITLES[index % TITLES.length];

			await contentRepository.save(
				contentRepository.create({
					article_id: article.id,
					language: 'en',
					slug,
					title,
					brief: `${title} — what to look for and what to skip.`,
					content: `<p>${title}.</p><p>Demo content for article ${sequenceLabel(index)}.</p>`,
					author: null,
					meta: {
						title,
						description: `${title} — a short guide`,
					},
				}),
			);

			if (categoryIds.length) {
				await categoryLinkRepository.save(
					categoryLinkRepository.create({
						article_id: article.id,
						category_id: randomPick(random, categoryIds),
					}),
				);
			}

			if (tagIds.length) {
				// A set, because two picks can land on the same tag and the link table
				// holds a unique index on (article_id, tag_id)
				const picked = new Set(
					Array.from({ length: randomInt(random, 1, 3) }, () =>
						randomPick(random, tagIds),
					),
				);

				await tagLinkRepository.save(
					Array.from(picked, (tag_id) =>
						tagLinkRepository.create({
							article_id: article.id,
							tag_id,
						}),
					),
				);
			}

			existingSlugs.add(slug);
			inserted++;
		}

		return {
			entity: 'article',
			alreadyPresent,
			inserted,
			target: TARGET,
			tableTotal: await articleRepository.count({ withDeleted: true }),
		};
	},
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(articleSeed);
}
