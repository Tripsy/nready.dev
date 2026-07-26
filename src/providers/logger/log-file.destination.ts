import { EOL } from 'node:os';
import FileStreamRotator from 'file-stream-rotator';
import { formatDate } from '@/helpers/date.helper';
import { buildRootPath } from '@/helpers/system.helper';
import {
	type LogDestination,
	LogDestinationEnum,
	type LogRecord,
} from '@/shared/types/log.type';
import type { LogDataLevel } from '@/shared/types/log-data.type';

type FileStreamRotatorStream = ReturnType<typeof FileStreamRotator.getStream>;

/** Close a per-level stream after this long without a write. */
const IDLE_TIMEOUT = 5 * 60 * 1000;

/**
 * Daily-rotated files under `logs/`, one stream per level.
 *
 * Streams are opened lazily and closed after `IDLE_TIMEOUT` so a quiet level doesn't hold
 * a file handle all day. `close()` clears the pending timers as well as the streams —
 * without that a timer surviving shutdown fires against an already-deleted entry and
 * throws inside the timer callback, where nothing can catch it.
 */
export class LogFileDestination implements LogDestination {
	readonly name = LogDestinationEnum.FILE;

	private streams: Partial<Record<LogDataLevel, FileStreamRotatorStream>> =
		{};
	private timeouts: Partial<Record<LogDataLevel, NodeJS.Timeout>> = {};

	constructor(readonly levels: ReadonlyArray<LogDataLevel>) {}

	private getStream(level: LogDataLevel): FileStreamRotatorStream {
		this.streams[level] ??= FileStreamRotator.getStream({
			filename: buildRootPath('logs', `%DATE%-${level}.log`),
			frequency: 'daily',
			date_format: 'YYYY-MM-DD',
		});

		if (this.timeouts[level]) {
			clearTimeout(this.timeouts[level]);
		}

		this.timeouts[level] = setTimeout(() => {
			this.streams[level]?.end('');

			delete this.streams[level];
			delete this.timeouts[level];
		}, IDLE_TIMEOUT);

		// Don't let an idle log stream keep the process alive on its own.
		this.timeouts[level]?.unref();

		return this.streams[level];
	}

	async write(record: LogRecord): Promise<void> {
		const line = {
			time: formatDate(record.time, undefined, {
				customFormat: 'HH:mm:ss Z',
			}),
			msg: record.message,
			request_id: record.request_id,
			category: record.category,
			context: record.context,
			// The full trace is kept for the database/CloudWatch records; on disk the
			// call site is enough and the trace dominates the line otherwise.
			debugStack: record.debugStack
				? {
						file: record.debugStack.file,
						line: record.debugStack.line,
						function: record.debugStack.function,
					}
				: undefined,
		};

		this.getStream(record.level).write(JSON.stringify(line) + EOL);
	}

	async close(): Promise<void> {
		for (const timeout of Object.values(this.timeouts)) {
			clearTimeout(timeout);
		}

		this.timeouts = {};

		const streams = Object.values(this.streams);

		this.streams = {};

		await Promise.all(
			streams.map(
				(stream) =>
					new Promise<void>((resolve) => {
						stream.on('finish', () => resolve());
						stream.end('');
					}),
			),
		);
	}
}
