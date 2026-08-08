import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
	describeError,
	errorResult,
	jsonResult,
	textResult,
} from '../shared/result.js';
import { runEntrypoint, startStdioServer } from '../shared/stdio.js';
import { closeClient, getClient } from './client.js';

const DEFAULT_LIMIT = 200;

const server = new McpServer({ name: 'redis-mcp', version: '1.0.0' });

/** Non-blocking SCAN loop (never uses KEYS, which blocks the server). */
const scanKeys = async (match: string, limit: number): Promise<string[]> => {
	const client = getClient();
	const found: string[] = [];
	let cursor = '0';

	do {
		const [next, batch] = await client.scan(
			cursor,
			'MATCH',
			match,
			'COUNT',
			200,
		);
		cursor = next;

		for (const key of batch) {
			found.push(key);
			if (found.length >= limit) {
				return found;
			}
		}
	} while (cursor !== '0');

	return found;
};

server.registerTool(
	'redis_get_key',
	{
		title: 'Read a key (type-aware)',
		description:
			'Return a key’s type, TTL, and value. Handles string, hash, list, set, and zset; large collections are truncated to `limit`.',
		inputSchema: {
			key: z.string().min(1).describe('The key to read.'),
			limit: z
				.number()
				.int()
				.positive()
				.optional()
				.describe(
					`Max elements for collections (default ${DEFAULT_LIMIT}).`,
				),
		},
	},
	async ({ key, limit }) => {
		const cap = limit ?? DEFAULT_LIMIT;
		const client = getClient();

		try {
			const type = await client.type(key);

			if (type === 'none') {
				return errorResult(`Key "${key}" does not exist.`);
			}

			const ttl = await client.ttl(key);
			let value: unknown;

			switch (type) {
				case 'string':
					value = await client.get(key);
					break;
				case 'hash':
					value = await client.hgetall(key);
					break;
				case 'list':
					value = await client.lrange(key, 0, cap - 1);
					break;
				case 'set':
					value = (await client.smembers(key)).slice(0, cap);
					break;
				case 'zset':
					value = await client.zrange(key, 0, cap - 1, 'WITHSCORES');
					break;
				default:
					value = `(type "${type}" not rendered)`;
			}

			return jsonResult({ key, type, ttl, value });
		} catch (error) {
			return errorResult(`Read failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'redis_scan',
	{
		title: 'Scan keys by pattern',
		description:
			'Find keys matching a glob pattern using non-blocking SCAN (safe on large DBs). Returns up to `limit` keys.',
		inputSchema: {
			match: z
				.string()
				.optional()
				.describe('Glob pattern, e.g. "user:*" (default "*").'),
			limit: z
				.number()
				.int()
				.positive()
				.optional()
				.describe(`Max keys to return (default ${DEFAULT_LIMIT}).`),
		},
	},
	async ({ match, limit }) => {
		const cap = limit ?? DEFAULT_LIMIT;

		try {
			const keys = await scanKeys(match ?? '*', cap);
			return jsonResult({
				returned: keys.length,
				truncated: keys.length >= cap,
				keys,
			});
		} catch (error) {
			return errorResult(`Scan failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'redis_ttl',
	{
		title: 'Get key TTL',
		description:
			'Return remaining TTL for a key in seconds (-1 = no expiry, -2 = missing) plus its type.',
		inputSchema: { key: z.string().min(1).describe('The key to inspect.') },
	},
	async ({ key }) => {
		const client = getClient();

		try {
			const [ttl, type] = await Promise.all([
				client.ttl(key),
				client.type(key),
			]);
			return jsonResult({ key, type, ttl });
		} catch (error) {
			return errorResult(`TTL lookup failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'redis_info',
	{
		title: 'Server INFO',
		description:
			'Return Redis server INFO, optionally scoped to a section (e.g. "memory", "clients", "keyspace").',
		inputSchema: {
			section: z
				.string()
				.optional()
				.describe(
					'INFO section, e.g. "memory" (default: all sections).',
				),
		},
	},
	async ({ section }) => {
		const client = getClient();

		try {
			const info = section
				? await client.info(section)
				: await client.info();
			return textResult(info);
		} catch (error) {
			return errorResult(`INFO failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'redis_set',
	{
		title: 'Set a string key',
		description:
			'Set a string value, optionally with a TTL in seconds. Overwrites an existing value.',
		inputSchema: {
			key: z.string().min(1).describe('The key to set.'),
			value: z.string().describe('The string value to store.'),
			ttlSeconds: z
				.number()
				.int()
				.positive()
				.optional()
				.describe('Optional expiry in seconds.'),
		},
	},
	async ({ key, value, ttlSeconds }) => {
		const client = getClient();

		try {
			if (ttlSeconds) {
				await client.set(key, value, 'EX', ttlSeconds);
			} else {
				await client.set(key, value);
			}
			return jsonResult({
				key,
				set: true,
				ttlSeconds: ttlSeconds ?? null,
			});
		} catch (error) {
			return errorResult(`Set failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'redis_expire',
	{
		title: 'Set key expiry',
		description: 'Set a TTL (seconds) on an existing key.',
		inputSchema: {
			key: z.string().min(1).describe('The key to expire.'),
			ttlSeconds: z
				.number()
				.int()
				.positive()
				.describe('Expiry in seconds.'),
		},
	},
	async ({ key, ttlSeconds }) => {
		const client = getClient();

		try {
			const applied = await client.expire(key, ttlSeconds);
			if (applied === 0) {
				return errorResult(`Key "${key}" does not exist; no TTL set.`);
			}
			return jsonResult({ key, ttlSeconds });
		} catch (error) {
			return errorResult(`Expire failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'redis_del',
	{
		title: 'Delete keys',
		description:
			'Delete one or more explicit keys (targeted, like DELETE … WHERE). Returns how many existed.',
		inputSchema: {
			keys: z
				.array(z.string().min(1))
				.min(1)
				.describe('Explicit key names to delete.'),
		},
	},
	async ({ keys }) => {
		const client = getClient();

		try {
			const deleted = await client.del(...keys);
			return jsonResult({ requested: keys.length, deleted });
		} catch (error) {
			return errorResult(`Delete failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'redis_flush',
	{
		title: 'Flush the current database (gated)',
		description:
			'Delete EVERY key in the current Redis database. Irreversible — refused unless `allowDestructive: true` is passed.',
		inputSchema: {
			allowDestructive: z
				.boolean()
				.optional()
				.describe('Must be true to actually flush.'),
		},
	},
	async ({ allowDestructive }) => {
		if (allowDestructive !== true) {
			return errorResult(
				'Refused: FLUSHDB wipes the entire database. Re-run with allowDestructive: true to proceed.',
			);
		}

		const client = getClient();

		try {
			await client.flushdb();
			return jsonResult({ flushed: true });
		} catch (error) {
			return errorResult(`Flush failed: ${describeError(error)}`);
		}
	},
);

runEntrypoint('redis-mcp', () =>
	startStdioServer(server, 'redis-mcp', closeClient),
);
