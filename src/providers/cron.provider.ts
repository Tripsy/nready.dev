import fs from 'node:fs';
import cron from 'node-cron';
import { v7 as uuid } from 'uuid';
import {
	RequestContextSourceEnum,
	requestContext,
} from '@/config/request.context';
import { Configuration } from '@/config/settings.config';
import { ModuleError, NotFoundError } from '@/exceptions';
import CronHistoryEntity, {
	CronHistoryStatusEnum,
} from '@/features/cron-history/cron-history.entity';
import { getCronHistoryRepository } from '@/features/cron-history/cron-history.repository';
import {
	createCurrentDate,
	dateDiff,
	getErrorMessage,
	getFeaturesFilesPathByFolderAndExtension,
	getFileNameWithoutExtension,
	getSharedFilePathsByExtension,
} from '@/helpers';
import { getCronLogger, getSystemLogger } from '@/providers/logger.provider';

export function getCronJobsPaths() {
	const sharedFolder = `${Configuration.get('folder.shared')}/cron-jobs`;
	const featuresFolder = Configuration.get('folder.features') as string;
	const fileExtension = `cron.${Configuration.resolveExtension()}`;

	const sharedPaths = getSharedFilePathsByExtension(
		sharedFolder,
		fileExtension,
	);
	const featurePaths = getFeaturesFilesPathByFolderAndExtension(
		featuresFolder,
		'/cron-jobs',
		fileExtension,
	);

	return [...sharedPaths, ...featurePaths];
}

export async function startCronJobs() {
	const cronJobsPaths = getCronJobsPaths();

	const promises = cronJobsPaths.map(async (filePath) => {
		try {
			const cronJobData = await loadCronJob(filePath);

			scheduleCronJob(cronJobData);

			return { name: cronJobData.name, status: 'fulfilled' } as const;
		} catch (error) {
			const skip = error instanceof ModuleError;
			const errorMsg = `${getErrorMessage(error) || `CronJobs setup errors`}`;

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
		getSystemLogger().debug(`Cron jobs started: ${successful.join(', ')}`);
	}

	if (failed.length) {
		getSystemLogger().error(failed, `Cron jobs errors`);
	}
}

/**
 * Execute a cron job and save history
 *
 * @param action - Should return cron_history `content`
 * @param expectedRunTime - Expected run time in seconds
 */
async function executeCron<R extends Record<string, unknown>>(
	action: () => Promise<R>,
	expectedRunTime: number,
) {
	return requestContext.run(
		{
			auth_id: 0,
			performed_by: action.name,
			source: RequestContextSourceEnum.CRON,
			request_id: uuid(),
			language: 'en',
		},
		async () => {
			const cronHistoryEntity = new CronHistoryEntity();
			cronHistoryEntity.label = action.name;
			cronHistoryEntity.start_at = createCurrentDate();

			try {
				cronHistoryEntity.content = await action();
				cronHistoryEntity.status = CronHistoryStatusEnum.OK;
			} catch (error) {
				if (error instanceof NotFoundError) {
					cronHistoryEntity.status = CronHistoryStatusEnum.OK;
					cronHistoryEntity.content = {
						removed: 0,
					};
				} else if (error instanceof Error) {
					cronHistoryEntity.status = CronHistoryStatusEnum.ERROR;
					cronHistoryEntity.content = {
						message: error.message,
					};

					getCronLogger().error(error, error.message);
				} else {
					cronHistoryEntity.status = CronHistoryStatusEnum.ERROR;
					cronHistoryEntity.content = {
						message: 'Unknown error',
					};

					getCronLogger().error(error, 'Unknown error');
				}
			} finally {
				cronHistoryEntity.end_at = createCurrentDate();
				cronHistoryEntity.run_time = dateDiff(
					cronHistoryEntity.end_at,
					cronHistoryEntity.start_at,
					'seconds',
				);

				if (
					cronHistoryEntity.run_time > expectedRunTime &&
					cronHistoryEntity.status !== CronHistoryStatusEnum.ERROR
				) {
					cronHistoryEntity.status = CronHistoryStatusEnum.WARNING;
				}

				await getCronHistoryRepository().save(cronHistoryEntity);
			}
		},
	);
}

type CronJobData = {
	name: string;
	filePath: string;
	schedule_expression: string;
	expected_run_time: number;
	jobFunction: () => Promise<Record<string, unknown>>;
};

async function loadCronJob(filePath: string): Promise<CronJobData> {
	if (!fs.existsSync(filePath)) {
		throw new ModuleError();
	}

	const module = await import(filePath);

	if (!module.default || typeof module.default !== 'function') {
		throw new Error(`No default export function found in ${filePath}`);
	}

	if (
		!module.SCHEDULE_EXPRESSION ||
		typeof module.SCHEDULE_EXPRESSION !== 'string'
	) {
		throw new Error(
			`Invalid or missing SCHEDULE_EXPRESSION in ${filePath}`,
		);
	}

	if (
		!module.EXPECTED_RUN_TIME ||
		typeof module.EXPECTED_RUN_TIME !== 'number'
	) {
		throw new Error(`Invalid or missing EXPECTED_RUN_TIME in ${filePath}`);
	}

	// Validate cron expression
	if (!cron.validate(module.SCHEDULE_EXPRESSION)) {
		throw new Error(
			`Invalid cron expression "${module.SCHEDULE_EXPRESSION}" in ${filePath}`,
		);
	}

	return {
		name: getFileNameWithoutExtension(filePath),
		filePath: filePath,
		schedule_expression: module.SCHEDULE_EXPRESSION,
		expected_run_time: module.EXPECTED_RUN_TIME,
		jobFunction: module.default,
	};
}

function scheduleCronJob(data: CronJobData) {
	cron.schedule(
		data.schedule_expression,
		async () => {
			await executeCron(data.jobFunction, 1);
		},
		{
			timezone: Configuration.get('app.timezone') || 'UTC',
		},
	);
}

export default startCronJobs;
