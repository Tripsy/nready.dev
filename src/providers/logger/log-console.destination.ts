import pinoPretty from 'pino-pretty';
import {
	type LogDestination,
	LogDestinationEnum,
	type LogRecord,
} from '@/shared/types/log.type';
import type { LogDataLevel } from '@/shared/types/log-data.type';

/**
 * Human-readable output for local development and test runs.
 *
 * Forwards `record.raw` — pino's untouched line — rather than re-serializing the normalized
 * record, because `pino-pretty` colorizes from the *numeric* level that `LogRecord.level`
 * has already resolved to a string.
 */
export class LogConsoleDestination implements LogDestination {
	readonly name = LogDestinationEnum.CONSOLE;

	private readonly pretty = pinoPretty({
		colorize: true,
		translateTime: 'HH:MM:ss Z',
		ignore: 'pid,hostname',
	});

	constructor(readonly levels: ReadonlyArray<LogDataLevel>) {}

	async write(record: LogRecord): Promise<void> {
		this.pretty.write(record.raw);
	}
}
