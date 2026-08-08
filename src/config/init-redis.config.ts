import Redis from 'ioredis';
import { Configuration } from '@/config/settings.config';
import { getSystemLogger } from '@/providers/logger.provider';

let redisInstance: Redis | null = null;

export const getRedisClient = (): Redis => {
	if (!redisInstance) {
		redisInstance = new Redis({
			host: Configuration.get('redis.host'),
			port: Configuration.get('redis.port'),
			password: Configuration.get('redis.password'),
		});

		redisInstance.on('error', (error) => {
			getSystemLogger().error({ err: error }, 'Redis connection error');
		});

		redisInstance.on('connect', () => {
			getSystemLogger().debug('Connected to Redis');
		});
	}

	return redisInstance;
};

export const redisClose = async (): Promise<void> => {
	if (redisInstance) {
		try {
			await redisInstance.quit();
			getSystemLogger().debug('Redis connection closed gracefully');
		} catch (error) {
			getSystemLogger().error(
				{ err: error },
				'Error closing Redis connection',
			);

			throw error;
		} finally {
			redisInstance = null;
		}
	}
};
