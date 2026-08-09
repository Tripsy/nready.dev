import {
	type CacheCleanEventPayload,
	eventEmitter,
} from '@/config/event.config';
import { runInBackground } from '@/helpers/background.helper';
import { cacheProvider } from '@/providers/cache.provider';

/**
 * Patterns with a delete currently running. `repeat` records that another clean for the same
 * pattern arrived while it was in flight.
 */
const inFlight = new Map<string, { repeat: boolean }>();

/**
 * Collapses duplicate cleans for the same pattern instead of running a Redis SCAN per event.
 *
 * A burst of identical cleans is normal: TypeORM broadcasts `afterInsert` per row, so writing
 * three translations of one article emits three cleans of `article:12*`. Services emit once
 * per operation (`cleanEntityCache`), but nothing mediates seeds, CLI scripts or direct row
 * writes, and this is the backstop for those.
 *
 * A duplicate is not dropped, it is folded into one trailing pass. Dropping it outright would
 * be wrong: the second clean may concern a write that landed after the first pass had already
 * scanned past the key, and nothing else would come along to correct it. Bursts therefore cost
 * two passes rather than N — and never fewer than the one that runs after the last write.
 *
 * Deliberately not a debounce: delaying the delete would let a client that reads straight after
 * its own write get the stale copy back, which is the failure this whole mechanism exists to
 * prevent.
 */
function deleteByPattern(pattern: string): void {
	const running = inFlight.get(pattern);

	if (running) {
		running.repeat = true;

		return;
	}

	const state = { repeat: false };

	inFlight.set(pattern, state);

	runInBackground(
		cacheProvider.deleteByPattern(pattern).finally(() => {
			inFlight.delete(pattern);

			if (state.repeat) {
				deleteByPattern(pattern);
			}
		}),
		`Failed to clean cache entries matching "${pattern}"`,
	);
}

export default function registerCacheListener() {
	eventEmitter.on('cacheClean', (payload: CacheCleanEventPayload) => {
		deleteByPattern(`${cacheProvider.buildKey(...payload.cacheKeyArgs)}*`);
	});
}
