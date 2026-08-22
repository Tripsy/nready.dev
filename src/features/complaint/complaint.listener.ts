import {
	type EntityRemovedEventPayload,
	eventEmitter,
} from '@/config/event.config';
import type { ComplaintEntityType } from '@/features/complaint/complaint.entity';
import { ComplaintEntityTypeEnum } from '@/features/complaint/complaint.entity';
import { complaintService } from '@/features/complaint/complaint.service';
import { runInBackground } from '@/helpers/background.helper';

const COMPLAINT_ENTITY_TYPES: readonly string[] = Object.values(
	ComplaintEntityTypeEnum,
);

/**
 * Whether this table can hold complaints about the announced target at all.
 *
 * `entityRemoved` is broadcast for every table that hard-deletes, so most of what arrives here
 * concerns rows nobody ever reported. A predicate rather than a cast: it narrows the payload's
 * plain table name to the enum the service takes, and the same check that decides to act is the
 * one that proves the type.
 */
function isComplaintTarget(
	entityType: string,
): entityType is ComplaintEntityType {
	return COMPLAINT_ENTITY_TYPES.includes(entityType);
}

/**
 * Clears the complaints filed against targets that have just been hard-deleted.
 *
 * The dependency points this way on purpose: `complaint` already knows which targets it accepts,
 * while the features owning those rows know nothing about this table. They announce what left and
 * each feature storing something against those ids answers for its own.
 *
 * Fire-and-forget through `runInBackground`, so a failed cleanup logs instead of rejecting into
 * `server.ts`'s `unhandledRejection` handler, which would shut the API down. Leftover complaints
 * are visible in the moderation queue rather than invisible, so a failure here is worth the log it
 * writes — unlike ratings, which simply stop being read.
 */
export default function registerComplaintListener() {
	eventEmitter.on('entityRemoved', (payload: EntityRemovedEventPayload) => {
		if (!isComplaintTarget(payload.entity_type)) {
			return;
		}

		runInBackground(
			complaintService.deleteByTargets(
				payload.entity_type,
				payload.entity_ids,
			),
			`Failed to remove complaints for ${payload.entity_type}(s) ${payload.entity_ids.join(', ')}`,
		);
	});
}
