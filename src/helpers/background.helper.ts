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
		getSystemLogger().error(error, context);
	});
}
