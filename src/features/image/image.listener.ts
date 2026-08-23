import {
	type EntityRemovedEventPayload,
	eventEmitter,
} from '@/config/event.config';
import { isImageSection } from '@/features/image/image.entity';
import { imageService } from '@/features/image/image.service';
import { runInBackground } from '@/helpers/background.helper';

/**
 * Clears the images filed against targets that have just been hard-deleted.
 *
 * The dependency points this way on purpose: `image` already knows which sections it stores for,
 * while the features owning those rows know nothing about this table — the same arrangement the
 * target-image registry uses in the other direction. They announce what left; each feature storing
 * something against those ids answers for its own.
 *
 * Wired ahead of any emitter: nothing hard-deletes an article, a brand, a category or a product
 * today, so this is what the first feature that starts to will meet. There is no self-trigger
 * either — `image` announces its own removals as `entity_type: 'image'`, which is not a section.
 *
 * Fire-and-forget through `runInBackground`, so a failed cleanup logs instead of rejecting into
 * `server.ts`'s `unhandledRejection` handler, which would shut the API down. The target is gone by
 * the time this runs; leftover images are invisible — nothing resolves an image for a target no
 * reader can open — and the next removal of the same ids clears them.
 */
export default function registerImageListener() {
	eventEmitter.on('entityRemoved', (payload: EntityRemovedEventPayload) => {
		if (!isImageSection(payload.entity_type)) {
			return;
		}

		runInBackground(
			imageService.deleteByTargets(
				payload.entity_type,
				payload.entity_ids,
			),
			`Failed to remove images for ${payload.entity_type}(s) ${payload.entity_ids.join(', ')}`,
		);
	});
}
