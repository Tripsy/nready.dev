// import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as readline from 'node:readline';
// import { promisify } from 'node:util';
import { display } from './helpers/console-display';
import { logToFile } from './helpers/console-log';
import { ConsoleRollback } from './helpers/console-rollback';
import {
	compareVersions,
	type Dependency,
	formatDependency,
	parseDependency,
	parseVersion,
	satisfiesRange,
} from './helpers/version';

interface Manifest {
	name: string;
	version: string;
	relativePath: string;
	entities: string[];
	/**
	 * Features this one needs, as `name` (any version) or `name@range` — `vendor@^2.0.0`.
	 * A range that the installed version does not satisfy blocks install and upgrade.
	 */
	depends_on: string[];
	/**
	 * Features that need this one, same grammar, plus the literal `core` marker that makes the
	 * feature unremovable. A declared entry only blocks removal while the installed version
	 * satisfies its range.
	 *
	 * Kept as a declaration even though installed dependents are also detected by scanning: the
	 * scan is authoritative for what is on disk right now, this records intent for what is not.
	 */
	depends_off: string[];
}

/** An installed feature that names another in its `depends_on`. */
type Dependent = {
	feature: string;
	range: string | null;
};

/** A `depends_on` / `depends_off` entry resolved against what is actually installed. */
type DependencyStatus = Dependency & {
	installedVersion: string | null;
	satisfied: boolean;
};

const CORE_MARKER = 'core';

type Mode = 'install' | 'remove' | 'upgrade';

type FeatureManagerArgs = {
	basePath: string;
	historyFilePath: string;
	feature: string;
	mode: Mode;
	debug: boolean;
	rollback: ConsoleRollback;
};

class FeatureManager {
	private readonly basePath: string;
	private readonly baseFeaturePath: string;
	private readonly baseSourcePath: string;
	private readonly historyFilePath: string;

	private rl: readline.Interface;

	private readonly feature: string;
	private readonly mode: Mode;
	private readonly debug: boolean;

	private rollback: ConsoleRollback;

	// private execAsync = promisify(exec);
	// private tmpDataSourceConfigFile: string = '';

	constructor(args: FeatureManagerArgs) {
		this.basePath = args.basePath;
		this.baseFeaturePath = path.join(this.basePath, 'src/features');
		this.baseSourcePath = path.join(this.basePath, 'packages');
		this.historyFilePath = args.historyFilePath;

		this.feature = args.feature;
		this.mode = args.mode;
		this.debug = args.debug;

		this.rollback = args.rollback;

		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		// TODO >  git status check
	}

	async run() {
		try {
			switch (this.mode) {
				case 'install':
					void logToFile(
						`${this.feature} / ${this.mode}: Init`,
						this.historyFilePath,
					);

					await this.installFeature();
					break;
				case 'remove':
					void logToFile(
						`${this.feature} / ${this.mode}: Init`,
						this.historyFilePath,
					);

					await this.removeFeature();
					break;
				case 'upgrade':
					void logToFile(
						`${this.feature} / ${this.mode}: Init`,
						this.historyFilePath,
					);

					await this.upgradeFeature();
					break;
				default:
					display.error(`Unknown mode: ${this.mode}`);
			}
		} catch (error) {
			if (error instanceof Error) {
				if (error.message) {
					display.error(error.message);

					await logToFile(
						`${this.feature} / ${this.mode}: ${error.message}`,
						this.historyFilePath,
					);
				} else {
					await logToFile(
						`${this.feature} / ${this.mode}: Abort`,
						this.historyFilePath,
					);
				}
			} else {
				console.error(error);

				await logToFile(
					`${this.feature} / ${this.mode}: Abort`,
					this.historyFilePath,
				);
			}

			display.blank();

			await this.rollback.process();

			display.blank().text('Process aborted', 'lock');

			process.exit(1);
		} finally {
			this.rl.close();
		}
	}

	private async askConfirmation(question: string): Promise<boolean> {
		return new Promise((resolve) => {
			this.rl.question(`${question} (Yes / No): `, (answer) => {
				resolve(/^[Yy][Ee]?[Ss]?$/.test(answer));
			});
		});
	}

	private async handleConfirmation(
		question: string = 'Are you sure you want to continue?',
	) {
		display.blank();

		const confirmation = await this.askConfirmation(question);

		if (!confirmation) {
			throw new Error();
		}
	}

	private async pathExists(path: string): Promise<boolean> {
		try {
			await fs.access(path);

			return true;
		} catch {
			return false;
		}
	}

	private async parseManifest(filePath: string): Promise<Manifest> {
		// Check if `manifest.json` file exist
		if (!(await this.pathExists(filePath))) {
			display
				.error(`Could not locate '${filePath}`)
				.text('Feature has to be removed manually');

			throw new Error();
		}

		try {
			const content = await fs.readFile(filePath, 'utf-8');
			const manifest: Manifest = JSON.parse(content);

			// Fail here rather than at the first comparison: every version check downstream
			// assumes a parseable version, and a manifest is cheap to fix before anything is copied
			parseVersion(manifest.version);

			return manifest;
		} catch (error) {
			throw new Error(`Invalid manifest.json (${filePath}): ${error}`);
		}
	}

	/** Returns `null` when the feature is not installed, rather than failing like `parseManifest`. */
	private async readInstalledManifest(
		feature: string,
	): Promise<Manifest | null> {
		const manifestPath = path.join(
			this.baseFeaturePath,
			feature,
			'manifest.json',
		);

		if (!(await this.pathExists(manifestPath))) {
			return null;
		}

		return this.parseManifest(manifestPath);
	}

	/**
	 * Resolves manifest entries against the installed tree. An entry is satisfied when the feature
	 * is installed *and* its version falls inside the declared range.
	 */
	private async resolveDependencies(
		entries: string[],
	): Promise<DependencyStatus[]> {
		const statuses: DependencyStatus[] = [];

		for (const entry of entries) {
			const dependency = parseDependency(entry);
			const manifest = await this.readInstalledManifest(dependency.name);

			statuses.push({
				...dependency,
				installedVersion: manifest?.version ?? null,
				satisfied:
					manifest !== null &&
					satisfiesRange(manifest.version, dependency.range),
			});
		}

		return statuses;
	}

	/**
	 * Scans every installed feature for a `depends_on` entry naming this one.
	 *
	 * Reverse dependencies are read off disk rather than off this feature's own `depends_off`,
	 * because that field is hand-maintained and drifts — `vendor` listed none while `cash-flow`
	 * depended on it, so removing `vendor` would have been allowed.
	 */
	private async getInstalledDependents(): Promise<Dependent[]> {
		const dependents: Dependent[] = [];
		const entries = await fs.readdir(this.baseFeaturePath, {
			withFileTypes: true,
		});

		for (const entry of entries) {
			if (!entry.isDirectory() || entry.name === this.feature) {
				continue;
			}

			const manifest = await this.readInstalledManifest(entry.name);

			if (!manifest) {
				continue;
			}

			for (const dependency of manifest.depends_on.map(parseDependency)) {
				if (dependency.name === this.feature) {
					dependents.push({
						feature: entry.name,
						range: dependency.range,
					});
				}
			}
		}

		return dependents;
	}

	/**
	 * Blocks when a dependency is missing, or installed at a version outside the declared range.
	 */
	private async assertDependenciesMet(
		manifest: Manifest,
		action: string,
	): Promise<void> {
		const statuses = await this.resolveDependencies(manifest.depends_on);
		const unsatisfied = statuses.filter((status) => !status.satisfied);

		if (unsatisfied.length === 0) {
			return;
		}

		display
			.blank()
			.warning(
				`The selected feature (e.g.: ${this.feature}) cannot be ${action}`,
			)
			.indentMore(4);

		unsatisfied.forEach((status) => {
			display.bullet(
				status.installedVersion === null
					? `${formatDependency(status)} is required but not installed`
					: `${formatDependency(status)} is required but v${status.installedVersion} is installed`,
			);
		});

		display.indentReset();

		display.tip('Start by installing or upgrading them.');

		throw new Error();
	}

	/**
	 * The mirror check: whether the version about to land still satisfies everything already
	 * installed on top of it. Without it an upgrade silently breaks its own dependents.
	 */
	private async assertDependentsAccept(version: string): Promise<void> {
		const dependents = await this.getInstalledDependents();
		const rejecting = dependents.filter(
			(dependent) => !satisfiesRange(version, dependent.range),
		);

		if (rejecting.length === 0) {
			return;
		}

		display
			.blank()
			.error(
				`Feature '${this.feature}' v${version} is not accepted by the installed features`,
			)
			.indentMore(4);

		rejecting.forEach((dependent) => {
			display.bullet(
				`${dependent.feature} requires ${this.feature}@${dependent.range}`,
			);
		});

		display.indentReset();

		display.tip('Upgrade them first, or relax their version range.');

		throw new Error();
	}

	private async dropDatabaseTables(tables: string[]) {
		display
			.blank()
			.warning(
				'The following database tables are related and need to be removed manually from DB',
			)
			.indentMore(4);

		tables.forEach((table) => {
			display.bullet(table);
		});

		display.indentReset();
	}

	private async copyDirectory(
		src: string,
		dest: string,
		ignore: string[] = [],
	) {
		await fs.mkdir(dest, { recursive: true });

		const entries = await fs.readdir(src, { withFileTypes: true });

		for (const entry of entries) {
			if (ignore.includes(entry.name)) continue;

			const srcPath = path.join(src, entry.name);
			const destPath = path.join(dest, entry.name);

			if (entry.isDirectory()) {
				await this.copyDirectory(srcPath, destPath, ignore);
			} else {
				await fs.copyFile(srcPath, destPath);
			}
		}
	}

	// async executeMigrationGenerate() {
	// 	try {
	// 		const command = `pnpx tsx ./node_modules/typeorm/cli.js migration:generate -d ${this.tmpDataSourceConfigFile} /var/www/html/src/database/migrations/feature-${this.feature}`;
	//
	// 		const { stdout, stderr } = await this.execAsync(command, {
	// 			cwd: this.basePath, // Set a working directory
	// 			maxBuffer: 1024 * 1024 * 10, // 10MB buffer for a large output
	// 		});
	//
	// 		// TypeORM often outputs to stderr even on success
	// 		const hasRealErrors =
	// 			stderr.toLowerCase().includes('error') &&
	// 			!stderr.toLowerCase().includes('no changes');
	//
	// 		if (hasRealErrors) {
	// 			display.blank().warning(`Warnings: ${stderr}`);
	//
	// 			return false;
	// 		}
	//
	// 		display
	// 			.blank()
	// 			.success('Migration generated successfully')
	// 			.text(stdout);
	//
	// 		return true;
	// 	} catch (error) {
	// 		if (error instanceof Error) {
	// 			display
	// 				.blank()
	// 				.error(
	// 					`Failed to generate migration: ${error.message || 'Unknown error'}`,
	// 				);
	// 		} else {
	// 			console.debug('');
	// 			console.error(error);
	// 		}
	//
	// 		return false;
	// 	}
	// }
	//
	// async executeMigrationRun() {
	// 	try {
	// 		const command =
	// 			'pnpx tsx ./node_modules/typeorm/cli.js migration:run -d /var/www/html/src/config/data-source.config.ts';
	//
	// 		const { stdout, stderr } = await this.execAsync(command, {
	// 			cwd: this.basePath, // Set a working directory
	// 			maxBuffer: 1024 * 1024 * 10, // 10MB buffer for a large output
	// 		});
	//
	// 		// TypeORM often outputs to stderr even on success
	// 		const hasRealErrors =
	// 			stderr.toLowerCase().includes('error') &&
	// 			!stderr.toLowerCase().includes('no changes');
	//
	// 		if (hasRealErrors) {
	// 			display.blank().warning(`Warnings: ${stderr}`);
	//
	// 			return false;
	// 		}
	//
	// 		display.blank().success('Migration run successfully').text(stdout);
	//
	// 		return true;
	// 	} catch (error) {
	// 		if (error instanceof Error) {
	// 			display
	// 				.blank()
	// 				.error(
	// 					`Failed to run migration: ${error.message || 'Unknown error'}`,
	// 				);
	// 		} else {
	// 			console.debug('');
	// 			console.error(error);
	// 		}
	//
	// 		return false;
	// 	}
	// }

	private async removeFeature() {
		const featurePath = path.join(this.baseFeaturePath, this.feature);
		const manifestPath = path.join(featurePath, 'manifest.json');

		display
			.text(`Remove feature "${this.feature}"`, 'headline')
			.tip(
				'Make sure you have a rollback plan. Use git to record your development progress',
			);

		display.blank().text('Starting removal...', 'arrow');

		// Check if the feature exists
		if (!(await this.pathExists(featurePath))) {
			display
				.blank()
				.error(`Feature '${this.feature}' is not installed.`)
				.blank()
				.tip('Try a fresh install');

			throw new Error();
		}

		const manifest = await this.parseManifest(manifestPath);

		if (manifest.depends_off.includes(CORE_MARKER)) {
			display
				.blank()
				.error(`Feature '${this.feature}' cannot be removed`)
				.text(`It is a core feature`);

			throw new Error();
		}

		// Declared reverse dependencies, minus the `core` marker handled above. A declaration only
		// blocks while the installed version is inside its range — `order@^1.0.0` says nothing
		// about an installed order v2
		const declared = await this.resolveDependencies(
			manifest.depends_off.filter((entry) => entry !== CORE_MARKER),
		);

		const blocking = [
			...new Set([
				...declared
					.filter(
						(status) =>
							status.installedVersion !== null &&
							status.satisfied,
					)
					.map((status) => status.name),
				...(await this.getInstalledDependents()).map(
					(dependent) => dependent.feature,
				),
			]),
		];

		if (blocking.length > 0) {
			display
				.blank()
				.error(
					`The selected feature (e.g.: ${this.feature}) cannot be removed`,
				)
				.text(
					`The following features depend on it: ${blocking.join(', ')}; Start by removing them.`,
				);

			throw new Error();
		}

		await this.handleConfirmation(
			`Are you sure you want to remove feature "${this.feature}"?`,
		);

		// Handle database tables
		if (manifest.entities && manifest.entities.length > 0) {
			await this.dropDatabaseTables(manifest.entities);

			display.blank();
		}

		try {
			await display.withDots(`Removing ${featurePath}`, async () => {
				if (this.debug === false) {
					await fs.rm(featurePath, { recursive: true, force: true });

					return `Folder ${featurePath} removed!`;
				} else {
					throw new Error(`Debug is ON`);
				}
			});
		} catch {
			throw new Error();
		}

		display
			.blank()
			.success(`Feature "${this.feature}" removed successfully!`);

		void logToFile(
			`${this.feature} / ${this.mode}: Completed`,
			this.historyFilePath,
		);
	}

	private async installFeature() {
		const sourcePath = path.join(this.baseSourcePath, this.feature);
		const manifestPath = path.join(sourcePath, 'manifest.json');

		display
			.text(`Install feature "${this.feature}"`, 'headline')
			.tip(
				'Make sure you have a rollback plan. Use git to record your development progress',
			)
			.blank();

		display.text('Installing...', 'arrow');

		// Check if the source exists
		if (!(await this.pathExists(sourcePath))) {
			display.blank().error(`Source package not found at: ${sourcePath}`);

			throw new Error();
		}

		const manifest = await this.parseManifest(manifestPath);

		const featurePath = path.join(
			this.baseFeaturePath,
			manifest.relativePath,
		);

		// Check if the feature exists
		if (await this.pathExists(featurePath)) {
			display
				.blank()
				.error(`Feature '${this.feature}' is already installed.`)
				.blank()
				.tip('Try upgrade instead');

			throw new Error();
		}

		// Check that every dependency is installed, at a version inside the declared range
		await this.assertDependenciesMet(manifest, 'installed');

		// ...and that whatever is already installed accepts the version landing here
		await this.assertDependentsAccept(manifest.version);

		// Confirm installation
		await this.handleConfirmation(
			`Ready to install "${this.feature}" v${manifest.version}?`,
		);

		display.blank();

		try {
			await display.withDots(
				`Copying files to ${featurePath}`,
				async () => {
					if (this.debug === false) {
						// Create the feature directory
						await fs.mkdir(featurePath);

						// Copy files from source to feature directory
						await this.copyDirectory(sourcePath, featurePath, [
							'node_modules',
							'.git',
						]);

						this.rollback.addUndoStep({
							description: `Remove ${featurePath}`,
							action: async () => {
								await fs.rm(featurePath, {
									recursive: true,
									force: true,
								});
							},
						});

						return `The files have been copied successfully`;
					} else {
						throw new Error(`Debug is ON`);
					}
				},
			);
		} catch {
			throw new Error();
		}

		if (manifest.entities.length === 0) {
			display
				.blank()
				.success(
					`Feature '${this.feature}' v${manifest.version} installed successfully!`,
				);

			void logToFile(
				`${this.feature} / ${this.mode}: v${manifest.version} installed`,
				this.historyFilePath,
			);

			// We're done
			return;
		}

		// Continue with migrations
		display
			.blank()
			.note(
				`Database structure updates are required. Feature contains following entities: ${manifest.entities.join(', ')}`,
			)
			.tip(
				'Run "migration:generate" to create migration file and "migration:run" to update DB',
			);

		display
			.blank()
			.success(
				`Feature '${this.feature}' v${manifest.version} installed successfully!`,
			);

		void logToFile(
			`${this.feature} / ${this.mode}: Done`,
			this.historyFilePath,
		);

		// try {
		// 	await this.handleConfirmation(
		// 		`Would you like to use the automated procedure for DB updates?`,
		// 	);
		// } catch {
		// 	display
		// 		.blank()
		// 		.success(
		// 			`Feature '${this.feature}' v${manifest.version} installed successfully!`,
		// 		)
		// 		.blank()
		// 		.tip(
		// 			"Don't forget to manually run migration:generate and migration:run to complete feature installation!",
		// 		);
		//
		// 	void logToFile(
		// 		`${this.feature} / ${this.mode}: Done (DB updates skipped)`,
		// 		this.historyFilePath,
		// 	);
		//
		// 	// We're done
		// 	return;
		// }

		// try {
		// 	display.blank();
		//
		// 	await display.withDots(
		// 		`Generating migration for ${this.feature}`,
		// 		async () => {
		// 			if (this.debug === false) {
		//                 await this.createTmpDataSourceConfigFile(manifest.entities);
		//
		// 				const status = await this.executeMigrationGenerate();
		//
		// 				if (status === false) {
		// 					throw new Error(
		// 						`Migration generation failed. Please run it manually.`,
		// 					);
		// 				}
		//
		// 				return `Migration generated for ${this.feature}!`;
		// 			} else {
		// 				throw new Error(`Debug is ON`);
		// 			}
		// 		},
		// 	);
		//
		// 	display.blank();
		//
		// 	await display.withDots(`Running migration`, async () => {
		// 		if (this.debug === false) {
		// 			const status = await this.executeMigrationRun();
		//
		// 			if (status === false) {
		// 				throw new Error(
		// 					`Migration failed. Please run it manually.`,
		// 				);
		// 			}
		//
		// 			return `Migration run with success!`;
		// 		} else {
		// 			throw new Error(`Debug is ON`);
		// 		}
		// 	});
		//
		//  Also run seeds
		//
		// 	display
		// 		.blank()
		// 		.success(
		// 			`Feature '${this.feature}' v${manifest.version} installed successfully!`,
		// 		);
		//
		// 	void logToFile(
		// 		`${this.feature} / ${this.mode}: Done`,
		// 		this.historyFilePath,
		// 	);
		// } catch {
		// 	throw new Error();
		// }
	}

	private async upgradeFeature() {
		const sourcePath = path.join(this.baseSourcePath, this.feature);
		const sourceManifestPath = path.join(sourcePath, 'manifest.json');
		const backupPath = path.join(
			this.basePath,
			'backup/features',
			this.feature,
		);

		display
			.text(`Upgrade feature "${this.feature}"`, 'headline')
			.tip(
				'Make sure you have a rollback plan. Use git to record your development progress',
			)
			.blank();

		display.text('Upgrading...', 'arrow');

		// Check if the source exists
		if (!(await this.pathExists(sourcePath))) {
			display.blank().error(`Source package not found at: ${sourcePath}`);

			throw new Error();
		}

		const sourceManifest = await this.parseManifest(sourceManifestPath);

		const featurePath = path.join(
			this.baseFeaturePath,
			sourceManifest.relativePath,
		);

		// Check if the feature exists
		if (!(await this.pathExists(featurePath))) {
			display
				.blank()
				.error(`Feature '${this.feature}' is not installed`)
				.tip('Try install instead');

			throw new Error();
		}

		// Check that every dependency is installed, at a version inside the range the *incoming*
		// package declares — the upgrade may well have raised it
		await this.assertDependenciesMet(sourceManifest, 'upgraded');

		const targetManifest = await this.parseManifest(
			path.join(featurePath, 'manifest.json'),
		);

		const versionStatus = compareVersions(
			targetManifest.version,
			sourceManifest.version,
		);

		if (versionStatus !== -1) {
			display
				.blank()
				.warning(
					`The selected feature (e.g.: ${this.feature}) version is already ${versionStatus === 0 ? 'up to date' : 'newer'} (installed v${targetManifest.version}, package v${sourceManifest.version})`,
				);

			throw new Error();
		}

		// A major bump can drop what a dependent still calls, so the features installed on top of
		// this one get a say before anything is overwritten
		await this.assertDependentsAccept(sourceManifest.version);

		// Confirm installation
		await this.handleConfirmation(
			`Ready to upgrade "${this.feature}" from v${targetManifest.version} to v${sourceManifest.version}?`,
		);

		display.blank();

		try {
			await display.withDots(
				`Copying files to ${featurePath}`,
				async () => {
					if (this.debug === false) {
						// // Create the feature directory
						// await fs.mkdir(featurePath);

						// Copy files from the feature directory to back up
						await this.copyDirectory(featurePath, backupPath, [
							'node_modules',
							'.git',
						]);

						// Copy files from source to feature directory
						await this.copyDirectory(sourcePath, featurePath, [
							'node_modules',
							'.git',
						]);

						this.rollback.addUndoStep({
							description: `Remove ${featurePath}`,
							action: async () => {
								await fs.rm(featurePath, {
									recursive: true,
									force: true,
								});
							},
						});

						this.rollback.addUndoStep({
							description: `Restoring backup ${backupPath}`,
							action: async () => {
								await this.copyDirectory(
									backupPath,
									featurePath,
									['node_modules', '.git'],
								);
							},
						});

						return `The files have been copied successfully`;
					} else {
						throw new Error(`Debug is ON`);
					}
				},
			);
		} catch {
			throw new Error();
		}

		try {
			await this.handleConfirmation(
				`Do you want to keep the back up files?`,
			);

			display.blank().tip(`Back up files are saved to ${backupPath}`);
		} catch {
			// Remove back up files
			await fs.rm(backupPath, {
				recursive: true,
				force: true,
			});
		}

		// Continue with migrations
		display
			.blank()
			.note(
				`Feature contains following entities: ${sourceManifest.entities.join(', ')}`,
			)
			.tip(
				'Run "migration:generate" to create migration file and "migration:run" to update DB',
			);

		display
			.blank()
			.success(
				`Feature '${this.feature}' upgraded from v${targetManifest.version} to v${sourceManifest.version} successfully!`,
			);

		void logToFile(
			`${this.feature} / ${this.mode}: Done`,
			this.historyFilePath,
		);
	}
}

// Main execution
async function main() {
	const basePath = '/var/www/html';
	const historyFilePath = path.join(basePath, 'cli', 'history.txt');

	const manager = new FeatureManager({
		basePath: basePath,
		historyFilePath: historyFilePath,
		feature: process.argv[2],
		mode: process.argv[3] as Mode,
		debug: process.argv[4] === 'debug' || false,
		rollback: new ConsoleRollback(historyFilePath),
	});

	await manager.run();
}

main().catch(console.error);
