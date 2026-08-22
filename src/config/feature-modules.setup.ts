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

/**
 * The startup half of the convention-based discovery: find one `<feature>.<suffix>` file per
 * feature, import it and call its default export.
 *
 * Two suffixes ride on this — `listener`, which subscribes to the shared emitter, and
 * `bootstrap`, which registers a feature with a shared registry — and they differ only in the
 * name scanned for and the folder scanned. Everything else is the same problem: a feature that
 * ships no such file is not an error, one that ships a broken one must not take the other
 * features down with it, and the outcome of the whole pass belongs in a single log line rather
 * than one per feature.
 */
async function runModule(filePath: string, label: string): Promise<void> {
	if (!fs.existsSync(filePath)) {
		throw new ModuleError();
	}

	const module = await import(filePath);

	if (module.default && typeof module.default === 'function') {
		await module.default();
	} else {
		throw new Error(
			`There is no 'export default' ${label} found in ${filePath}`,
		);
	}
}

export async function runFeatureModules(options: {
	/** File suffix without the extension — `listener` finds `<feature>.listener.ts`. */
	fileSuffix: string;
	/** Folder under `src/shared` holding the same kind of file, when there is one. */
	sharedFolder?: string;
	/** Wording for the log lines — "Listeners", "Feature bootstrap". */
	label: string;
}): Promise<void> {
	const featuresFolder = Configuration.get('folder.features') as string;
	const fileExtension = `${options.fileSuffix}.${Configuration.resolveExtension()}`;

	const featurePaths = getFeaturesFilePathByExtension(
		featuresFolder,
		fileExtension,
	);

	const sharedPaths = options.sharedFolder
		? getSharedFilePathsByExtension(
				`${Configuration.get('folder.shared')}/${options.sharedFolder}`,
				fileExtension,
			)
		: [];

	const modulePaths = [...featurePaths, ...sharedPaths];

	const promises = modulePaths.map(async (filePath) => {
		try {
			await runModule(filePath, options.fileSuffix);

			return {
				name: getFileNameWithoutExtension(filePath),
				status: 'fulfilled',
			} as const;
		} catch (error) {
			const skip = error instanceof ModuleError;
			const errorMsg = `${getErrorMessage(error) || `${options.label} setup errors`}`;

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
			`${options.label} registered successfully for: ${successful.join(', ')}`,
		);
	}

	if (failed.length) {
		getSystemLogger().error(failed, `Failed ${options.label} setup`);
	}
}
