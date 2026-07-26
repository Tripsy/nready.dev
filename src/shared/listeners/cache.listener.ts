import {
	type CacheCleanEventPayload,
	eventEmitter,
} from '@/config/event.config';
import { runInBackground } from '@/helpers/background.helper';
import { cacheProvider } from '@/providers/cache.provider';

export default function registerCacheListener() {
	eventEmitter.on('cacheClean', (payload: CacheCleanEventPayload) => {
		const pattern = `${cacheProvider.buildKey(...payload.cacheKeyArgs)}*`;

		runInBackground(
			cacheProvider.deleteByPattern(pattern),
			`Failed to clean cache entries matching "${pattern}"`,
		);
	});
}
