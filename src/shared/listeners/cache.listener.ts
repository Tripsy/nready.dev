import {
	type CacheCleanEventPayload,
	eventEmitter,
} from '@/config/event.config';
import { cacheProvider } from '@/providers/cache.provider';
import { runInBackground } from '@/providers/logger.provider';

export default function registerCacheListener() {
	eventEmitter.on('cacheClean', (payload: CacheCleanEventPayload) => {
		const pattern = `${cacheProvider.buildKey(...payload.cacheKeyArgs)}*`;

		runInBackground(
			cacheProvider.deleteByPattern(pattern),
			`Failed to clean cache entries matching "${pattern}"`,
		);
	});
}
