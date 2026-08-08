import Redis from 'ioredis';
import { loadProjectEnv, resolveHost } from '../shared/env.js';

loadProjectEnv();

let client: Redis | null = null;

export const getClient = (): Redis => {
	if (!client) {
		const password = process.env.REDIS_PASSWORD;

		client = new Redis({
			host: resolveHost(
				process.env.REDIS_HOST,
				process.env.MCP_REDIS_HOST,
			),
			port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
			// Empty string must mean "no auth", not "AUTH ''", so this stays `||`.
			password: password && password.length > 0 ? password : undefined,
			lazyConnect: true,
			connectTimeout: 5_000,
			maxRetriesPerRequest: 2,
			// Fail fast instead of retrying forever when the server is unreachable.
			retryStrategy: (times) =>
				times > 2 ? null : Math.min(times * 200, 1_000),
		});

		// Per-command promises already reject on failure; this listener just
		// prevents an unhandled 'error' event from crashing the process.
		client.on('error', () => undefined);
	}

	return client;
};

export const closeClient = async (): Promise<void> => {
	if (client) {
		await client.quit().catch(() => undefined);
		client = null;
	}
};
