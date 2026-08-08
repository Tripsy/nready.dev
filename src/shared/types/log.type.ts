import type {
	LogDataCategory,
	LogDataLevel,
} from '@/shared/types/log-data.type';

export const LogDestinationEnum = {
	CONSOLE: 'console',
	FILE: 'file',
	DATABASE: 'database',
	EMAIL: 'email',
	CLOUDWATCH: 'cloudwatch',
} as const;

export type LogDestinationName =
	(typeof LogDestinationEnum)[keyof typeof LogDestinationEnum];

export type CallStack = {
	trace: string[];
	file: string;
	line: number;
	function: string;
};

/**
 * A log line after `LogStream` has normalized pino's raw JSON.
 *
 * Built once per line and handed to every destination, replacing the previous
 * `JSON.parse(JSON.stringify(log))` that each destination did for itself. Destinations
 * must treat it as read-only — they share the same object.
 */
export type LogRecord = {
	readonly level: LogDataLevel;
	/** Epoch milliseconds, as pino emits it. Destinations format it as they need. */
	readonly time: number;
	readonly pid: string;
	readonly message: string;
	readonly category: LogDataCategory;
	readonly request_id?: string;
	readonly debugStack?: CallStack;
	readonly context?: Record<string, unknown>;
	/**
	 * Pino's original JSON line. Only the console destination uses it, so pretty-printing
	 * keeps rendering exactly what pino emitted (levels included, which `pino-pretty`
	 * colorizes from the numeric value that `LogRecord.level` has already resolved away).
	 */
	readonly raw: string;
};

/**
 * One place a log line can go.
 *
 * Adding a destination means adding a file that implements this and registering it in
 * `log-destinations.factory.ts` — `LogStream` itself never changes. `levels` is read by
 * the factory, so a destination that accepts nothing is dropped at startup rather than
 * being asked to no-op on every line.
 */
export interface LogDestination {
	readonly name: LogDestinationName;
	readonly levels: ReadonlyArray<LogDataLevel>;
	/**
	 * Deliver one record. Must not throw — a destination that fails is the logger's
	 * problem to swallow, never the caller's. Rejections are caught and reported to
	 * `console.error` by `LogStream`, since logging the logger would recurse.
	 */
	write(record: LogRecord): Promise<void>;
	/** Flush and release resources on shutdown. */
	close?(): Promise<void>;
}
