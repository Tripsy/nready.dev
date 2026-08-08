import fs from 'node:fs';
import { Configuration } from '@/config/settings.config';
import { ModuleError } from '@/exceptions';
import {
	getErrorMessage,
	getFeaturesFilePathByExtension,
	getFileNameWithoutExtension,
	getSharedFilePathsByExtension,
} from '@/helpers/system.helper';
import { getSystemLogger } from '@/providers/logger.provider';

async function registerListener(filePath: string) {
	if (!fs.existsSync(filePath)) {
		throw new ModuleError();
	}

	const module = await import(filePath);

	if (module.default && typeof module.default === 'function') {
		module.default();
	} else {
		throw new Error(
			`There is no 'export default' listener found in ${filePath}`,
		);
	}
}

export async function setupListeners() {
	const sharedFolder = `${Configuration.get('folder.shared')}/listeners`;
	const featuresFolder = Configuration.get('folder.features') as string;
	const fileExtension = `listener.${Configuration.resolveExtension()}`;

	const sharedPaths = getSharedFilePathsByExtension(
		sharedFolder,
		fileExtension,
	);
	const featurePaths = getFeaturesFilePathByExtension(
		featuresFolder,
		fileExtension,
	);

	const listenerPaths = [...featurePaths, ...sharedPaths];

	const promises = listenerPaths.map(async (filePath) => {
		try {
			await registerListener(filePath);

			return {
				name: getFileNameWithoutExtension(filePath),
				status: 'fulfilled',
			} as const;
		} catch (error) {
			const skip = error instanceof ModuleError;
			const errorMsg = `${getErrorMessage(error) || `Listeners setup errors`}`;

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
			`Listeners registered successfully for: ${successful.join(', ')}`,
		);
	}

	if (failed.length) {
		getSystemLogger().error(failed, `Failed listeners setup`);
	}
}
