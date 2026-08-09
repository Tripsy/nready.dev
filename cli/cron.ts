// TODO:
//  data-source.config.ts is loading subscribers and entities and basically triggers things from the system;
//  therefore while testing the cron (which works) some errors are reported related to language system
//  possible solutions will be to use a separate data source for cron jobs (e.g. a separate database) or maybe lazy load
//  the data source dependencies

import { Command } from 'commander';
import archiveArticle from '@/features/article/cron-jobs/archive-article.cron';
import publicRestrictedArticle from '@/features/article/cron-jobs/public-restricted-article.cron';
import publishScheduledArticle from '@/features/article/cron-jobs/publish-scheduled-article.cron';
import cronTimeCheck from '@/shared/cron-jobs/cron-time-check.cron';
import dataSource from '../src/config/data-source.config';
import { getCronJobsPaths } from '../src/providers/cron.provider';

type CronJob = () => Promise<unknown>;

const program = new Command();

const cronJobs: Record<string, CronJob> = {
	'cron-time-check': cronTimeCheck,
	'archive-article': archiveArticle,
	'public-restricted-article': publicRestrictedArticle,
	'publish-scheduled-article': publishScheduledArticle,
};

program
	.command('run <cron-name>')
	.description('Run a specific cron job manually')
	.action(async (cronName: string) => {
		const cronFn = cronJobs[cronName];

		if (!cronFn) {
			console.error(`Unknown cron: ${cronName}`);
			console.debug(
				`Available cron jobs: ${Object.keys(cronJobs).join(', ')}`,
			);

			process.exit(1);
		}

		await dataSource.initialize();

		console.debug(`Running ${cronName}...`);
		const result = await cronFn();
		console.debug('Result: ', result);

		process.exit(0);
	});

program
	.command('list')
	.description('List all available cron jobs')
	.option('-s, --system', 'List cron jobs from system (filesystem)')
	.action((options) => {
		if (options.system) {
			console.debug('System cron jobs:');

			// Shared + per-feature paths, the same list the scheduler itself registers
			getCronJobsPaths().forEach((path) => {
				console.debug(`  - ${path}`);
			});

			return;
		}

		console.debug('Testable cron jobs:');

		Object.keys(cronJobs).forEach((name) => {
			console.debug(`  - ${name}`);
		});
	});

program.parse();
