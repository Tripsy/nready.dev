import { Configuration } from '@/config/settings.config';
import { LogCloudWatchDestination } from '@/providers/logger/log-cloudwatch.destination';
import { LogConsoleDestination } from '@/providers/logger/log-console.destination';
import { LogDatabaseDestination } from '@/providers/logger/log-database.destination';
import { LogEmailDestination } from '@/providers/logger/log-email.destination';
import { LogFileDestination } from '@/providers/logger/log-file.destination';
import type { LogDestination } from '@/shared/types/log.type';
import type { LogDataLevel } from '@/shared/types/log-data.type';

function levelsFor(key: string): ReadonlyArray<LogDataLevel> {
	return (Configuration.get(key) as LogDataLevel[] | undefined) ?? [];
}

/**
 * Builds the destination set for the current environment.
 *
 * This is the only place that knows which destinations exist. Adding one means adding a
 * class and a line here — `LogStream` fans out over whatever it is handed, so it never
 * changes. Destinations configured with no levels are left out entirely rather than
 * constructed and skipped per line, which also avoids opening an AWS client or a file
 * handle that would never be used.
 */
export function buildLogDestinations(): LogDestination[] {
	const destinations: LogDestination[] = [];

	const consoleLevels = levelsFor('logging.levelConsole');

	if (consoleLevels.length > 0) {
		destinations.push(new LogConsoleDestination(consoleLevels));
	}

	const fileLevels = levelsFor('logging.levelFile');

	if (fileLevels.length > 0) {
		destinations.push(new LogFileDestination(fileLevels));
	}

	const databaseLevels = levelsFor('logging.levelDatabase');

	if (databaseLevels.length > 0) {
		destinations.push(new LogDatabaseDestination(databaseLevels));
	}

	const emailLevels = levelsFor('logging.levelEmail');

	if (emailLevels.length > 0 && Configuration.get('logging.logEmail')) {
		destinations.push(new LogEmailDestination(emailLevels));
	}

	const cloudWatchLevels = levelsFor('logging.levelCloudWatch');
	const logGroupName = Configuration.get('aws.cloudwatch.logGroup') as string;
	const logStreamName = Configuration.get(
		'aws.cloudwatch.logStream',
	) as string;

	// Without a log group there is nothing to write to, so the destination is skipped
	// rather than constructed to fail on every flush.
	if (cloudWatchLevels.length > 0 && logGroupName) {
		destinations.push(
			new LogCloudWatchDestination(
				cloudWatchLevels,
				logGroupName,
				logStreamName,
			),
		);
	}

	return destinations;
}
