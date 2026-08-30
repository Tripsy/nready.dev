import { getSystemLogger } from '@/providers/logger.provider';

/**
 * Runs a promise the caller deliberately does not await, logging any rejection.
 *
 * Use this instead of a bare `void somePromise()`. An unhandled rejection is not merely
 * noisy here: `server.ts` listens for `unhandledRejection` and responds by shutting the
 * server down, so one failed background side effect — a mail send, a cache purge — would
 * take the whole API with it.
 */
export function runInBackground(
	promise: Promise<unknown>,
	context: string,
): void {
	promise.catch((error: unknown) => {
		/*
		 * Wrapped in `{ err }` rather than passed as the merge object directly. Pino only
		 * applies its error serializer to a recognized error key; a bare Error passed as
		 * the first argument is merged as a plain object, and because Error's `message` and
		 * `stack` are non-enumerable, the record reaches the log destinations with an empty
		 * context — the message survives, every detail of *why* does not.
		 *
		 * This is the failure path for every fire-and-forget side effect in the app, so
		 * losing the cause here means losing it everywhere it matters most.
		 */
		getSystemLogger().error({ err: error }, context);
	});
}
