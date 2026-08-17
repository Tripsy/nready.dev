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
import CategoryEntity, {
	CategoryTypeEnum,
} from '@/features/category/category.entity';
import TermEntity, { TermTypeEnum } from '@/features/term/term.entity';
import UserEntity from '@/features/user/user.entity';

const TARGET = 96;

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
	'Docking stations, ranked by regret',
	'When a mouse is worth replacing',
	'Reading the fine print on warranties',
	'Desk lamps and the colour of light',
	'A chair you will still like in year three',
	'Backups that actually get restored',
	'Notes on refurbished hardware',
	'Two machines, one keyboard',
	'What a good return policy looks like',
	'Cheap cables and expensive lessons',
	'Standing desks after the novelty',
	'Colour accuracy without the ceremony',
	'The quiet case for wired networking',
	'Buying storage you will not outgrow',
	'Laptop bags that survive a commute',
	'Screen sizes and the space you have',
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

		// Article categories only: a product category linked to an article would be listed
		// under a tree the article site never shows.
		const categoryIds = await loadIds(manager, CategoryEntity, {
			type: CategoryTypeEnum.ARTICLE,
		});
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
					/*
					 * A scheduled article is due in the future; a published one is
					 * already out. Every third one is dated within the last few days,
					 * because the public listing switches from a relative date to an
					 * absolute one at two weeks and both branches need rows to show.
					 */
					publish_at: isScheduled
						? new Date(
								Date.now() +
									randomInt(random, 1, 30) * 86400 * 1000,
							)
						: randomPastDate(random, index % 3 === 0 ? 6 : 120),
					archive_at: null,
					// Every seventh row, so the featured treatment is visible in a listing
					// without the whole page wearing it.
					featured_status:
						index % 7 === 0
							? ArticleFeaturedStatusEnum.SECTION
							: null,
					featured_order: index % 7 === 0 ? (index + 1) * 10 : 0,
					visibility: ArticleVisibilityEnum.PUBLIC,
					source_mode: ArticleSourceModeEnum.INPUT,
					author_id: userIds.length
						? randomPick(random, userIds)
						: null,
				}),
			);

			/*
			 * The title list is shorter than the target, so it wraps. A repeated title
			 * gets its pass number appended — the slug is already unique per index, and
			 * two rows reading identically in a listing look like a bug rather than
			 * volume.
			 */
			const pass = Math.floor(index / TITLES.length);
			const title = pass
				? `${TITLES[index % TITLES.length]} (part ${pass + 1})`
				: TITLES[index % TITLES.length];

			await contentRepository.save(
				contentRepository.create({
					article_id: article.id,
					language: 'en',
					slug,
					title,
					brief: `${title} — what to look for and what to skip.`,
					// Markdown, which is what the column holds and the editor edits — the
					// dashboard renders it to HTML for display only.
					content: `## ${title}\n\nDemo content for article ${sequenceLabel(index)}.`,
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
