import fs from 'node:fs';
import type { Server } from 'node:http';
import { Configuration } from '@/config/settings.config';
import { ModuleError } from '@/exceptions';
import {
	getErrorMessage,
	getFeaturesFilesPathByFolderAndExtension,
	getFileNameWithoutExtension,
} from '@/helpers';
import { getSystemLogger } from '@/providers/logger.provider';

type CleanupFn = () => void;

const registeredCleanups: CleanupFn[] = [];

async function startWebSocket(filePath: string, server: Server) {
	if (!fs.existsSync(filePath)) {
		throw new ModuleError();
	}

	const module = await import(filePath);

	if (!module.init || typeof module.init !== 'function') {
		throw new Error(`There is no 'init' function found in ${filePath}`);
	}

	module.init(server);

	// Register cleanup if the gateway exports one
	if (module.cleanup && typeof module.cleanup === 'function') {
		registeredCleanups.push(module.cleanup);
	}
}

export async function setupWebSockets(server: Server): Promise<void> {
	const featuresFolder = Configuration.get('folder.features') as string;
	const fileExtension = `gateway.${Configuration.resolveExtension()}`;

	const webSocketPaths = getFeaturesFilesPathByFolderAndExtension(
		featuresFolder,
		'/websocket',
		fileExtension,
	);

	const promises = webSocketPaths.map(async (filePath) => {
		try {
			await startWebSocket(filePath, server);

			return {
				name: getFileNameWithoutExtension(filePath),
				status: 'fulfilled',
			} as const;
		} catch (error) {
			const skip = error instanceof ModuleError;
			const errorMsg = getErrorMessage(error) || 'Web socket start error';

			return {
				name: filePath,
				status: 'rejected',
				reason: errorMsg,
				skip,
			} as const;
		}
	});

	const results = await Promise.all(promises);

	const successful = results
		.filter((r) => r.status === 'fulfilled')
		.map((r) => r.name);

	const failed = results
		.filter((r) => r.status === 'rejected' && !r.skip)
		.map((r) => r.reason ?? 'unknown');

	if (successful.length) {
		getSystemLogger().debug(
			`Web sockets started successfully for: ${successful.join(', ')}`,
		);
	}

	if (failed.length) {
		getSystemLogger().error(failed, 'Failed web sockets setup');
	}
}

export function cleanupWebSockets(): void {
	for (const cleanup of registeredCleanups) {
		try {
			cleanup();
		} catch (err) {
			getSystemLogger().warn(err, 'WebSocket cleanup error');
		}
	}

	registeredCleanups.length = 0;
}
