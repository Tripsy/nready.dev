import {
	isDirectRun,
	loadIds,
	randomInt,
	type SeedDefinition,
	type SeedSummary,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import ArticleEntity from '@/features/article/article.entity';
import ImageEntity, {
	ImageMimeEnum,
	ImageSectionEnum,
	ImageStatusEnum,
	ImageStorageEnum,
	ImageTypeEnum,
} from '@/features/image/image.entity';

/**
 * Article cover art for the public site.
 *
 * Only the rows are seeded here — the bytes live in the **frontend** container, under
 * `nready-ui/public/uploads/`, because `IMAGE_SAVE_PATH` is a frontend setting and the UI is
 * what writes and serves uploads. `nready-ui/.claude/scripts/fetch-seed-images.sh` fetches
 * files for exactly the paths below; a row without its file renders as a broken image, so
 * run the two together.
 *
 * Deliberately partial: `COVERED_IN` of every `COVERED_OF` articles gets an image, so the
 * listing shows both shapes and the layout is exercised with and without art.
 */
const COVERED_IN = 2;
const COVERED_OF = 3;

/** Matches what the fetch script downloads; picsum serves this size. */
const COVER_WIDTH = 1200;
const COVER_HEIGHT = 675;

/**
 * Stable filename rather than the uuid the upload flow mints: a seed has to be able to name
 * the file it expects, so the fetch script and this row agree without passing state between
 * two projects.
 */
export function buildArticleCoverPath(articleId: number): string {
	return `article/${articleId}/cover.jpg`;
}

export const imageSeed: SeedDefinition = {
	name: 'image',
	run: async ({ manager, random }): Promise<SeedSummary> => {
		const imageRepository = manager.getRepository(ImageEntity);

		const articleIds = await loadIds(manager, ArticleEntity);

		const targetIds = articleIds.filter(
			(_id, index) => index % COVERED_OF < COVERED_IN,
		);

		const existing = await imageRepository.find({
			select: { entity_id: true },
			where: { section: ImageSectionEnum.ARTICLE },
		});

		const covered = new Set(existing.map((image) => image.entity_id));

		let alreadyPresent = 0;
		let inserted = 0;

		for (const articleId of targetIds) {
			if (covered.has(articleId)) {
				alreadyPresent++;
				continue;
			}

			await imageRepository.save(
				imageRepository.create({
					section: ImageSectionEnum.ARTICLE,
					entity_id: articleId,
					image_type: ImageTypeEnum.GALLERY,
					storage: ImageStorageEnum.LOCAL,
					path: buildArticleCoverPath(articleId),
					properties: {
						width: COVER_WIDTH,
						height: COVER_HEIGHT,
						mime: ImageMimeEnum.JPEG,
					},
					status: ImageStatusEnum.ACTIVE,
					// Spread out rather than all zero, so "first by sort_order" is a real
					// ordering once a second image is added by hand.
					sort_order: randomInt(random, 1, 10) * 10,
					details: null,
				}),
			);

			inserted++;
		}

		return {
			entity: 'image',
			alreadyPresent,
			inserted,
			target: targetIds.length,
			tableTotal: await imageRepository.count(),
		};
	},
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(imageSeed);
}
