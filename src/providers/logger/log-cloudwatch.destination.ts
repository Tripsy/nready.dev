import {
	CloudWatchLogsClient,
	CreateLogStreamCommand,
	type InputLogEvent,
	PutLogEventsCommand,
	ResourceAlreadyExistsException,
} from '@aws-sdk/client-cloudwatch-logs';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Configuration } from '@/config/settings.config';
import { getErrorMessage } from '@/helpers';
import {
	type LogDestination,
	LogDestinationEnum,
	type LogRecord,
} from '@/shared/types/log.type';
import type { LogDataLevel } from '@/shared/types/log-data.type';

/*
 * PutLogEvents service limits (see the CloudWatch Logs API reference). Batches are split
 * to stay inside all of them; exceeding any one rejects the whole call, which would lose
 * the batch rather than truncate it.
 */
const MAX_BATCH_EVENTS = 10_000;
const MAX_BATCH_BYTES = 1_048_576;
/** CloudWatch counts 26 bytes of overhead per event on top of the UTF-8 message. */
const EVENT_OVERHEAD_BYTES = 26;
/** Single events above this are truncated rather than dropped. */
const MAX_EVENT_BYTES = 256 * 1024;

/** How long a partial batch waits before being sent anyway. */
const FLUSH_INTERVAL = 5_000;
/**
 * Ceiling on unsent events. If CloudWatch is unreachable the buffer would otherwise grow
 * without bound and turn a logging outage into an OOM; past this point the oldest events
 * are dropped, which is the cheapest failure available to a log sink.
 */
const MAX_BUFFERED_EVENTS = 10_000;

/**
 * Ships log lines to a CloudWatch Logs stream.
 *
 * Buffered and flushed on a timer rather than written per line: `PutLogEvents` is a network
 * round trip, and one call per log line would both throttle (5 req/s/stream) and dominate
 * request latency. The trade-off is that up to `FLUSH_INTERVAL` of logs can be lost on a
 * hard crash — `close()` covers graceful shutdown.
 *
 * Credentials come from `defaultProvider()`, matching `email-ses.service.ts`, so instance
 * roles / SSO / env vars all work without app-level configuration.
 */
export class LogCloudWatchDestination implements LogDestination {
	readonly name = LogDestinationEnum.CLOUDWATCH;

	private readonly client: CloudWatchLogsClient;
	private buffer: InputLogEvent[] = [];
	private flushTimer: NodeJS.Timeout | null = null;
	private streamReady: Promise<void> | null = null;
	private droppedEvents = 0;

	constructor(
		readonly levels: ReadonlyArray<LogDataLevel>,
		private readonly logGroupName: string,
		private readonly logStreamName: string,
	) {
		this.client = new CloudWatchLogsClient({
			region: Configuration.get('aws.region') as string,
			credentials: defaultProvider(),
		});
	}

	/**
	 * Creates the log stream once per process. The log group is assumed to exist — it
	 * carries retention and encryption settings that belong in infrastructure, not here.
	 */
	private ensureStream(): Promise<void> {
		this.streamReady ??= this.client
			.send(
				new CreateLogStreamCommand({
					logGroupName: this.logGroupName,
					logStreamName: this.logStreamName,
				}),
			)
			.then(() => undefined)
			.catch((error: unknown) => {
				if (error instanceof ResourceAlreadyExistsException) {
					return;
				}

				// Reset so a transient failure (throttle, blip) is retried on next flush
				// instead of poisoning the destination for the process lifetime.
				this.streamReady = null;

				throw error;
			});

		return this.streamReady;
	}

	async write(record: LogRecord): Promise<void> {
		let message = JSON.stringify({
			level: record.level,
			category: record.category,
			message: record.message,
			request_id: record.request_id,
			pid: record.pid,
			debugStack: record.debugStack,
			context: record.context,
		});

		if (Buffer.byteLength(message, 'utf8') > MAX_EVENT_BYTES) {
			message = `${message.slice(0, MAX_EVENT_BYTES - 32)}…[truncated]`;
		}

		this.buffer.push({ timestamp: record.time, message });

		if (this.buffer.length > MAX_BUFFERED_EVENTS) {
			this.buffer.splice(0, this.buffer.length - MAX_BUFFERED_EVENTS);
			this.droppedEvents += 1;
		}

		if (this.buffer.length >= MAX_BATCH_EVENTS) {
			await this.flush();

			return;
		}

		this.scheduleFlush();
	}

	private scheduleFlush(): void {
		if (this.flushTimer) {
			return;
		}

		this.flushTimer = setTimeout(() => {
			this.flushTimer = null;

			this.flush().catch((error: unknown) => {
				console.error(
					'CloudWatch log flush failed:',
					getErrorMessage(error),
				);
			});
		}, FLUSH_INTERVAL);

		// A pending flush must not hold the event loop open on its own.
		this.flushTimer.unref();
	}

	/**
	 * Splits the buffer into service-legal batches and sends them in order.
	 *
	 * On failure the unsent remainder is put back at the front of the buffer so the next
	 * flush retries it, subject to `MAX_BUFFERED_EVENTS`.
	 */
	private async flush(): Promise<void> {
		if (this.buffer.length === 0) {
			return;
		}

		const pending = this.buffer;

		this.buffer = [];

		if (this.droppedEvents > 0) {
			console.error(
				`CloudWatch log buffer overflow: dropped ${this.droppedEvents} event(s)`,
			);

			this.droppedEvents = 0;
		}

		try {
			await this.ensureStream();

			for (const batch of this.buildBatches(pending)) {
				await this.client.send(
					new PutLogEventsCommand({
						logGroupName: this.logGroupName,
						logStreamName: this.logStreamName,
						logEvents: batch,
					}),
				);
			}
		} catch (error) {
			this.buffer = [...pending, ...this.buffer].slice(
				-MAX_BUFFERED_EVENTS,
			);

			throw error;
		}
	}

	/** Chronologically ordered batches, each within the event-count and byte limits. */
	private buildBatches(events: InputLogEvent[]): InputLogEvent[][] {
		const ordered = [...events].sort(
			(a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0),
		);

		const batches: InputLogEvent[][] = [];

		let batch: InputLogEvent[] = [];
		let batchBytes = 0;

		for (const event of ordered) {
			const eventBytes =
				Buffer.byteLength(event.message ?? '', 'utf8') +
				EVENT_OVERHEAD_BYTES;

			if (
				batch.length >= MAX_BATCH_EVENTS ||
				batchBytes + eventBytes > MAX_BATCH_BYTES
			) {
				batches.push(batch);

				batch = [];
				batchBytes = 0;
			}

			batch.push(event);
			batchBytes += eventBytes;
		}

		if (batch.length > 0) {
			batches.push(batch);
		}

		return batches;
	}

	async close(): Promise<void> {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);

			this.flushTimer = null;
		}

		try {
			await this.flush();
		} catch (error) {
			console.error(
				'CloudWatch log flush failed on shutdown:',
				getErrorMessage(error),
			);
		}

		this.client.destroy();
	}
}
