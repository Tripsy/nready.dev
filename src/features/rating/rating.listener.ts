import {
	type EntityRemovedEventPayload,
	eventEmitter,
} from '@/config/event.config';
import type { RatingEntityType } from '@/features/rating/rating.entity';
import { RatingEntityTypeEnum } from '@/features/rating/rating.entity';
import { ratingService } from '@/features/rating/rating.service';
import { runInBackground } from '@/helpers/background.helper';

const RATING_ENTITY_TYPES: readonly string[] =
	Object.values(RatingEntityTypeEnum);

/**
 * Whether this table can hold ratings for the announced target at all.
 *
 * `entityRemoved` is broadcast for every table that hard-deletes, so most of what arrives here
 * concerns rows nobody ever rated. A predicate rather than a cast: it narrows the payload's plain
 * table name to the enum the service takes, and the same check that decides to act is the one that
 * proves the type.
 */
function isRatingTarget(entityType: string): entityType is RatingEntityType {
	return RATING_ENTITY_TYPES.includes(entityType);
}

/**
 * Clears the ratings cast on targets that have just been hard-deleted.
 *
 * The dependency points this way on purpose: `rating` already knows which targets it accepts,
 * while the features owning those rows know nothing about this table. They announce what left and
 * each feature storing something against those ids answers for its own — so a target added later
 * needs no change here beyond its enum entry.
 *
 * Fire-and-forget through `runInBackground`, so a failed cleanup logs instead of rejecting into
 * `server.ts`'s `unhandledRejection` handler, which would shut the API down. The target is already
 * gone by the time this runs; leftover ratings are invisible — nothing reads them once their
 * target cannot be resolved — and the next removal of the same ids clears them.
 */
export default function registerRatingListener() {
	eventEmitter.on('entityRemoved', (payload: EntityRemovedEventPayload) => {
		if (!isRatingTarget(payload.entity_type)) {
			return;
		}

		runInBackground(
			ratingService.deleteByTargets(
				payload.entity_type,
				payload.entity_ids,
			),
			`Failed to remove ratings for ${payload.entity_type}(s) ${payload.entity_ids.join(', ')}`,
		);
	});
}
