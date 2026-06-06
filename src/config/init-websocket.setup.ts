import fs from 'node:fs';
import type { Server } from 'node:http';
import { Configuration } from '@/config/settings.config';
import { ModuleError } from '@/exceptions/module.error';
import {
	getErrorMessage,
	getFeaturesFilesPathByFolderAndExtension,
	getFileNameWithoutExtension,
} from '@/helpers';
import { getSystemLogger } from '@/providers/logger.provider';

async function startWebSocket(filePath: string, server: Server) {
	if (!fs.existsSync(filePath)) {
		throw new ModuleError();
	}

	const module = await import(filePath);

	if (module.init && typeof module.init === 'function') {
		module.init(server);
	} else {
		throw new Error(`There is no 'init' function found in ${filePath}`);
	}
}

export async function setupWebSockets(server: Server): Promise<void> {
	const featuresFolder = Configuration.get<string>(
		'folder.features',
	) as string;
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
			const errorMsg = `${getErrorMessage(error) || `Web sockets start errors`}`;

			return {
				name: filePath,
				status: 'rejected',
				reason: errorMsg,
				skip: skip,
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
		getSystemLogger().error(failed, `Failed web sockets setup`);
	}
}
