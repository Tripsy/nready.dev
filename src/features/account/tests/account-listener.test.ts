import { expect, jest } from '@jest/globals';
import {
	eventEmitter,
	type UserRegisteredEventPayload,
} from '@/config/event.config';
import registerAccountListener from '@/features/account/account.listener';
import { accountService } from '@/features/account/account.service';
import { UserStatusEnum } from '@/features/user/user.entity';
import { getUserEntityMock } from '@/features/user/user.mock';
import { getSystemLogger } from '@/providers/logger.provider';

function getPayloadMock(): UserRegisteredEventPayload {
	const user = getUserEntityMock();

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		language: user.language,
		status: UserStatusEnum.PENDING,
	};
}

describe('registerAccountListener', () => {
	beforeEach(() => {
		// The emitter is a module-level singleton, so a listener registered by one test
		// would still be attached in the next and fire twice.
		eventEmitter.removeAllListeners('userRegistered');
	});

	afterEach(() => {
		eventEmitter.removeAllListeners('userRegistered');

		jest.restoreAllMocks();
	});

	it('should subscribe to userRegistered', () => {
		expect(eventEmitter.listenerCount('userRegistered')).toBe(0);

		registerAccountListener();

		expect(eventEmitter.listenerCount('userRegistered')).toBe(1);
	});

	it('should forward the payload to processRegistration', async () => {
		const processRegistration = jest
			.spyOn(accountService, 'processRegistration')
			.mockImplementation(() => undefined);

		registerAccountListener();

		const payload = getPayloadMock();

		eventEmitter.emit('userRegistered', payload);

		// The handler is async and the emit is fire-and-forget, so yield once before
		// asserting.
		await Promise.resolve();

		expect(processRegistration).toHaveBeenCalledTimes(1);
		expect(processRegistration).toHaveBeenCalledWith(payload);
	});

	it('should swallow and log a failing registration', async () => {
		jest.spyOn(accountService, 'processRegistration').mockImplementation(
			() => {
				throw new Error('mail transport down');
			},
		);

		const logger = jest
			.spyOn(getSystemLogger(), 'error')
			.mockImplementation(() => undefined);

		registerAccountListener();

		/*
		 * Regression guard. This listener used to be `async`, which turned the throw into
		 * an unhandled rejection — and `server.ts` responds to those by shutting the
		 * server down. A failed welcome email must not take the API with it.
		 */
		expect(() =>
			eventEmitter.emit('userRegistered', getPayloadMock()),
		).not.toThrow();

		await Promise.resolve();

		expect(logger).toHaveBeenCalledTimes(1);
	});
});
