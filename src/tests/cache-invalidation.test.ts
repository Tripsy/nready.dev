import { expect, jest } from '@jest/globals';
import {
	type CacheCleanEventPayload,
	eventEmitter,
} from '@/config/event.config';
import { cacheProvider } from '@/providers/cache.provider';
import { cleanEntityCache } from '@/shared/abstracts/service.abstract';
import registerCacheListener from '@/shared/listeners/cache.listener';

/**
 * Cache invalidation is split across two mechanisms and this pins the contract of both: the
 * service emits one clean per operation (`cleanEntityCache`), and the listener collapses any
 * burst that still reaches it — seeds, CLI scripts, or a subscriber firing per row.
 */

const CachedEntity = { NAME: 'brand', HAS_CACHE: true };
const UncachedEntity = { NAME: 'article_tag', HAS_CACHE: false };

describe('cleanEntityCache', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	function captureCleans(): string[][] {
		const captured: string[][] = [];

		jest.spyOn(eventEmitter, 'emit').mockImplementation(((
			event: string,
			payload: CacheCleanEventPayload,
		) => {
			if (event === 'cacheClean') {
				captured.push(payload.cacheKeyArgs);
			}

			return true;
		}) as never);

		return captured;
	}

	it('emits one clean keyed by entity name and id', () => {
		const captured = captureCleans();

		cleanEntityCache(CachedEntity, 12);

		expect(captured).toEqual([['brand', '12']]);
	});

	it('stays silent for an entity that is not cached', () => {
		const captured = captureCleans();

		cleanEntityCache(UncachedEntity, 12);

		expect(captured).toEqual([]);
	});
});

describe('cache listener coalescing', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
		eventEmitter.removeAllListeners('cacheClean');
	});

	afterAll(() => {
		eventEmitter.removeAllListeners('cacheClean');
	});

	/** Resolves the pending delete on demand, so the in-flight window is controllable. */
	function deferredDeleteSpy() {
		const calls: string[] = [];
		const resolvers: Array<() => void> = [];

		jest.spyOn(cacheProvider, 'deleteByPattern').mockImplementation(
			(pattern: string) => {
				calls.push(pattern);

				return new Promise<void>((resolve) => {
					resolvers.push(() => resolve());
				});
			},
		);

		return { calls, resolvers };
	}

	it('runs a single pass for a burst of identical cleans', async () => {
		const { calls, resolvers } = deferredDeleteSpy();

		registerCacheListener();

		// Three rows of the same parent, as TypeORM broadcasts them
		for (let index = 0; index < 3; index++) {
			eventEmitter.emit('cacheClean', { cacheKeyArgs: ['brand', '4'] });
		}

		expect(calls).toHaveLength(1);

		// The duplicates are folded into one trailing pass rather than dropped — a later
		// clean may concern a write the first pass already scanned past
		resolvers[0]();
		await new Promise((resolve) => setImmediate(resolve));

		expect(calls).toHaveLength(2);

		resolvers[1]();
		await new Promise((resolve) => setImmediate(resolve));

		expect(calls).toHaveLength(2);
	});

	it('does not coalesce cleans for different patterns', () => {
		const { calls } = deferredDeleteSpy();

		registerCacheListener();

		eventEmitter.emit('cacheClean', { cacheKeyArgs: ['brand', '4'] });
		eventEmitter.emit('cacheClean', { cacheKeyArgs: ['brand', '5'] });

		expect(calls).toHaveLength(2);
	});
});
