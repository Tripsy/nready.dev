import {
	eventEmitter,
	type UserRegisteredEventPayload,
} from '@/config/event.config';
import { accountService } from '@/features/account/account.service';
import { getErrorMessage } from '@/helpers';
import { getSystemLogger } from '@/providers/logger.provider';

export default function registerAccountListener() {
	eventEmitter.on('userRegistered', (payload: UserRegisteredEventPayload) => {
		/*
		 * Deliberately synchronous with a `try`/`catch`: `processRegistration` is itself
		 * synchronous and can throw.
		 *
		 * Inside the previous `async` listener that throw became a rejected promise
		 * nothing awaited, and `server.ts` turns an unhandled rejection into a full
		 * graceful shutdown — so a bad mail template would have taken the API down on the
		 * next registration. The account is already created by this point; a failed
		 * follow-up mail is worth logging, not worth failing over.
		 */
		try {
			accountService.processRegistration(payload);
		} catch (error) {
			getSystemLogger().error(
				error,
				`Failed to process registration for user #${payload.id}: ${getErrorMessage(error)}`,
			);
		}
	});
}
