import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

let loaded = false;

/**
 * Load the project-root .env once.
 *
 * import.meta.dirname is absolute (Node 20.11+), so the path resolves from this
 * file's location — independent of the cwd Claude Code spawns the server with.
 * Path: src/shared -> src -> mcp -> .claude -> project root.
 */
export const loadProjectEnv = (): void => {
	if (loaded) {
		return;
	}

	loadEnv({ path: resolve(import.meta.dirname, '../../../../.env') });
	loaded = true;
};

/**
 * Resolve the host the MCP (running on the host machine) must dial.
 *
 * Containers reach each other via `host.docker.internal`, but from the host the
 * service is published on 127.0.0.1. An explicit `override` (e.g. MCP_DB_HOST)
 * wins if the backing store ever moves off localhost.
 */
export const resolveHost = (
	rawHost: string | undefined,
	override?: string,
): string => {
	if (override) {
		return override;
	}

	const host = rawHost ?? '127.0.0.1';
	return host === 'host.docker.internal' ? '127.0.0.1' : host;
};
