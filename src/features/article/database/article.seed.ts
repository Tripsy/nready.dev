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
	'Desk lamps and the color of light',
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
 * The article the public site is developed against — index 1, so `article-0002`. The rest of
 * the seed is volume: one title, one paragraph, no attribution. This one carries what the
 * article page actually has to lay out — several headings with prose between them, a by-line
 * with a bio, and the source block a parsed article shows — so every one of those branches is
 * visible without hand-editing the database.
 */
const SHOWCASE_INDEX = 1;

const SHOWCASE_CONTENT = `Desk accessories are where a budget quietly leaks. Most of them solve a problem
you do not have, and the few that matter are the ones you stop noticing after a week.

## Start with what you touch all day

The keyboard, the mouse and the chair are in contact with you for hours. Everything else is
scenery. If the budget only stretches to one upgrade, spend it here — a wrist that aches at
four in the afternoon is not fixed by a nicer monitor arm.

Look for a switch weight you can sustain, not the one that feels best in the shop. Ten minutes
of typing tells you more than any specification sheet.

## A monitor arm buys back the desk

The stand a monitor ships with is designed to survive a drop test, not to leave you room to
write. An arm clamps to the back edge and returns the whole footprint to you.

- Check the VESA pattern before ordering; 100×100 is common, 75×75 is not gone.
- Weigh the monitor. Gas-spring arms have a range, and one loaded past it drifts down all day.
- Clamp mounts need a desk edge under 60 mm and nothing bolted underneath.

## Cable management is a one-afternoon job

Two adhesive channels and a fistful of reusable ties will outlast three attempts at doing it
properly later. The trick is to route power and data separately, then leave one slack loop
near the desk so the whole thing survives a monitor being raised.

> Anything you have to unplug weekly belongs on the front of the desk, not behind it.

## Light before decoration

A desk lamp with adjustable color temperature is the accessory people regret buying last and
should have bought first. Cool light in the morning, warm after sunset, and the screen stops
being the brightest thing in the room.

## What to skip

Wrist rests that force an angle, drawer organizers for a drawer you do not open, and any hub
that draws its power from the laptop it is supposed to be charging. None of these fail
loudly — they simply sit there, having cost money.

## Where to stop

A desk is finished when nothing on it annoys you. That is a lower bar than the shopping lists
suggest, and reaching it costs less than one bad monitor.`;

const SHOWCASE_AUTHOR = {
	name: 'Irina Balan',
	email: 'irina.balan@example.com',
	description:
		'Writes about the hardware people actually keep. Ten years of buying, returning and living with desk equipment, mostly so you do not have to.',
};

const SHOWCASE_SOURCE = {
	label: 'Desk Notes Weekly',
	url: 'https://example.com/desk-notes/accessories-worth-the-space',
	about: 'An independent newsletter reviewing workspace hardware, published since 2018. It buys what it reviews and takes no vendor placements.',
	disclaimer:
		"Republished with permission. The text is the publisher's; any errors introduced in editing are ours.",
};

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

			const isShowcase = index === SHOWCASE_INDEX;

			const status = randomPick(random, [
				ArticleStatusEnum.DRAFT,
				ArticleStatusEnum.PENDING,
				ArticleStatusEnum.SCHEDULED,
				ArticleStatusEnum.PUBLISHED,
				ArticleStatusEnum.PUBLISHED,
				ArticleStatusEnum.ARCHIVED,
			]);

			// The showcase article is what the public page is opened against, so it is
			// published rather than left to the random spread.
			const isScheduled =
				!isShowcase && status === ArticleStatusEnum.SCHEDULED;

			const article = await articleRepository.save(
				articleRepository.create({
					status: isShowcase ? ArticleStatusEnum.PUBLISHED : status,
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
					source_mode: isShowcase
						? ArticleSourceModeEnum.PARSED
						: ArticleSourceModeEnum.INPUT,
					source: isShowcase ? SHOWCASE_SOURCE : null,
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
					content: isShowcase
						? SHOWCASE_CONTENT
						: `## ${title}\n\nDemo content for article ${sequenceLabel(index)}.`,
					author: isShowcase ? SHOWCASE_AUTHOR : null,
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
