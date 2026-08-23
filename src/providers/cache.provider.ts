import type Redis from 'ioredis';
import { getRedisClient } from '@/config/init-redis.config';
import { Configuration } from '@/config/settings.config';
import { getSystemLogger } from '@/providers/logger.provider';

type CacheData = unknown;
type CacheGetResults = {
	isCached: boolean;
	data: CacheData | null;
};

export class CacheProvider {
	constructor(private readonly cache: Redis) {}

	/**
	 * Every key is built here, so prefixing at this point covers reads, writes and the patterns
	 * handed to `deleteByPattern` alike — the invalidation helpers assemble theirs as
	 * `${buildKey(...args)}*`. An empty `redis.keyPrefix` drops out via the same filter that
	 * removes empty segments, leaving keys unprefixed.
	 */
	buildKey(...args: string[]) {
		return [Configuration.get('redis.keyPrefix'), ...args]
			.filter((arg) => arg !== '')
			.join(':');
	}

	determineTtl(ttl?: number): number {
		return ttl === undefined ? Configuration.get('cache.ttl') : ttl;
	}

	formatInputData(data: CacheData): string | number {
		if (typeof data === 'number') {
			return data;
		}

		if (typeof data === 'boolean') {
			return data ? 'true' : 'false';
		}

		if (typeof data === 'string') {
			return data;
		}

		try {
			return JSON.stringify(data);
		} catch {
			return String(data);
		}
	}

	formatOutputData(data: CacheData): CacheData {
		if (data === null || typeof data !== 'string') {
			return data;
		}

		try {
			/*
			 * Objects, arrays and quoted strings are parsed back; a bare number is left as the
			 * string Redis returned. That is deliberate — "42" cannot be told apart from a
			 * numeric string a caller stored on purpose, so coercing it here would corrupt
			 * one to serve the other. Callers that need a number convert it themselves.
			 */
			const trimmed = data.trim();

			if (
				trimmed.startsWith('{') ||
				trimmed.startsWith('[') ||
				trimmed.startsWith('"')
			) {
				return JSON.parse(data);
			}

			return data;
		} catch {
			// Return as-is if not valid JSON
			return data;
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			const exists = await this.cache.exists(key);

			return exists === 1;
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error checking existence for key: ${key}`,
			);
			return false;
		}
	}

	async get(
		key: string,
		fetchFunction: () => Promise<CacheData>,
		ttl?: number,
	): Promise<CacheGetResults> {
		const results: CacheGetResults = {
			isCached: false,
			data: null,
		};

		const resolvedTtl = this.determineTtl(ttl);

		if (resolvedTtl === 0) {
			results.data = await fetchFunction();

			return results;
		}

		let cachedData: string | null = null;

		try {
			cachedData = await this.cache.get(key);
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error fetching cache for key: ${key}`,
			);
		}

		if (cachedData) {
			results.isCached = true;
			results.data = this.formatOutputData(cachedData);

			return results;
		}

		results.data = await fetchFunction();

		await this.set(key, results.data, resolvedTtl);

		return results;
	}

	async set(key: string, data: CacheData, ttl?: number) {
		const resolvedTtl = this.determineTtl(ttl);

		/*
		 * Redis rejects `EX 0` outright ("ERR invalid expire time in 'set' command"), and the
		 * catch below would turn that into a silent no-op with only a log line. A resolved TTL
		 * of 0 means caching is switched off — `get()` already reads it that way — so skip the
		 * write rather than issue one that cannot succeed. `CACHE_TTL=0` is the supported way to
		 * turn caching off for an environment, which is why the setting keeps an explicit 0
		 * rather than falling back.
		 */
		if (resolvedTtl <= 0) {
			return;
		}

		try {
			if (data !== null) {
				await this.cache.set(
					key,
					this.formatInputData(data),
					'EX',
					resolvedTtl,
				);
			}
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error setting cache for key: ${key}`,
			);
		}
	}

	async delete(key: string): Promise<void> {
		try {
			await this.cache.del(key);
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error deleting cache for key: ${key}`,
			);
		}
	}

	/**
	 * Delete multiple cache entries by pattern.
	 * @param pattern - The pattern to match cache keys.
	 *
	 * ex: pattern = user:* > user:1, user:2
	 */
	async deleteByPattern(pattern: string): Promise<void> {
		try {
			let cursor = '0';

			do {
				// Scan for matching keys in small batches
				const [nextCursor, keys] = await this.cache.scan(
					cursor,
					'MATCH',
					pattern,
					'COUNT',
					100,
				);
				cursor = nextCursor;

				if (keys.length > 0) {
					const pipeline = this.cache.pipeline();

					keys.forEach((key) => {
						pipeline.del(key);
					});

					await pipeline.exec();
				}
			} while (cursor !== '0'); // Continue until all keys are scanned
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error deleting cache with pattern: ${pattern}`,
			);
		}
	}

	/**
	 * Drops every key under `<namespace>:<ident>:…` for a set of idents, in a single scan.
	 *
	 * `MATCH` takes one glob, so N idents through `deleteByPattern` is N full passes over the
	 * keyspace — a bulk delete of a few thousand rows would scan it a few thousand times. One
	 * wide pass filtered in the client trades a narrower `MATCH` for a constant number of round
	 * trips, which is the better deal past a single ident.
	 *
	 * The ident is matched as a whole key **segment**, not a prefix: asking for `4` must not take
	 * `40` with it. The stored prefix is sliced off first rather than splitting the whole key,
	 * because `redis.keyPrefix` is configurable and may itself contain a colon.
	 */
	async deleteByIdents(namespace: string, idents: string[]): Promise<void> {
		if (idents.length === 0) {
			return;
		}

		const wanted = new Set(idents);
		const prefix = `${this.buildKey(namespace)}:`;

		try {
			let cursor = '0';

			do {
				const [nextCursor, keys] = await this.cache.scan(
					cursor,
					'MATCH',
					`${prefix}*`,
					'COUNT',
					100,
				);
				cursor = nextCursor;

				const matched = keys.filter((key) => {
					const rest = key.slice(prefix.length);
					const boundary = rest.indexOf(':');

					return wanted.has(
						boundary === -1 ? rest : rest.slice(0, boundary),
					);
				});

				if (matched.length > 0) {
					const pipeline = this.cache.pipeline();

					matched.forEach((key) => {
						pipeline.del(key);
					});

					await pipeline.exec();
				}
			} while (cursor !== '0');
		} catch (error) {
			getSystemLogger().error(
				error,
				`Error deleting cache for "${namespace}" idents: ${idents.join(', ')}`,
			);
		}
	}
}

class MockCacheProvider extends CacheProvider {
	constructor() {
		// Passing a dummy Redis, which will not be used
		super({} as Redis);
	}

	async exists(_key: string): Promise<boolean> {
		return false;
	}

	async get(
		_key: string,
		fetchFunction: () => Promise<CacheData>,
		_ttl?: number,
	): Promise<CacheGetResults> {
		const data = await fetchFunction();

		return {
			isCached: false,
			data,
		};
	}

	async set(_key: string, _data: CacheData, _ttl?: number): Promise<void> {
		// intentionally no-op
	}

	async delete(_key: string): Promise<void> {
		// intentionally no-op
	}

	async deleteByPattern(_pattern: string): Promise<void> {
		// intentionally no-op
	}

	async deleteByIdents(_namespace: string, _idents: string[]): Promise<void> {
		// intentionally no-op
	}

	// Kept identical to the real provider's: the mock stores nothing, but two divergent key
	// builders is exactly the drift that bites later.
	buildKey(...args: string[]): string {
		return [Configuration.get('redis.keyPrefix'), ...args]
			.filter((arg) => arg !== '')
			.join(':');
	}
}

export const cacheProvider = Configuration.isEnvironment('test')
	? new MockCacheProvider()
	: new CacheProvider(getRedisClient());
