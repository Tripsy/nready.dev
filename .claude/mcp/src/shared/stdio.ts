import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { describeError } from './result.js';

/**
 * Connect a server over stdio and wire graceful shutdown.
 *
 * stdout is reserved for the JSON-RPC stream, so all logging goes to stderr —
 * a stray stdout write would corrupt the protocol.
 */
export const startStdioServer = async (
	server: McpServer,
	name: string,
	onShutdown?: () => Promise<void>,
): Promise<void> => {
	const shutdown = async (): Promise<void> => {
		if (onShutdown) {
			await onShutdown().catch(() => undefined);
		}
		process.exit(0);
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);

	const transport = new StdioServerTransport();
	await server.connect(transport);
	process.stderr.write(`${name} server ready (stdio)\n`);
};

/** Standard entrypoint wrapper: run `main`, report a fatal failure on stderr. */
export const runEntrypoint = (
	name: string,
	main: () => Promise<void>,
): void => {
	main().catch((error) => {
		process.stderr.write(
			`${name} failed to start: ${describeError(error)}\n`,
		);
		process.exit(1);
	});
};
