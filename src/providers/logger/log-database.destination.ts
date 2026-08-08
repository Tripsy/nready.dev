import dataSource from '@/config/data-source.config';
import LogDataEntity from '@/features/log-data/log-data.entity';
import { getErrorMessage } from '@/helpers/system.helper';
import {
	type LogDestination,
	LogDestinationEnum,
	type LogRecord,
} from '@/shared/types/log.type';
import type { LogDataLevel } from '@/shared/types/log-data.type';

/**
 * Persists log lines to `log_data` for the dashboard's log viewer.
 *
 * Silently skipped while the data source is uninitialized — logs are emitted during
 * bootstrap and shutdown, when the connection either doesn't exist yet or is already gone,
 * and a rejected insert there would be reported through the very logger that produced it.
 */
export class LogDatabaseDestination implements LogDestination {
	readonly name = LogDestinationEnum.DATABASE;

	constructor(readonly levels: ReadonlyArray<LogDataLevel>) {}

	async write(record: LogRecord): Promise<void> {
		if (!dataSource.isInitialized) {
			return;
		}

		const logData = new LogDataEntity();
		logData.pid = record.pid;
		logData.request_id = record.request_id ?? null;
		logData.category = record.category;
		logData.level = record.level;
		logData.message = record.message;
		logData.debug_stack = record.debugStack;
		logData.context = record.context;

		try {
			await dataSource.manager.save(LogDataEntity, logData);
		} catch (error) {
			console.error('Log database write failed:', getErrorMessage(error));
		}
	}
}
