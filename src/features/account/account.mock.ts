import type { ConfirmationTokenPayload } from '@/features/account/account.service';
import type AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import type { AuthValidToken } from '@/features/account/account-token.service';
import { createFutureDate, createPastDate } from '@/helpers';
import { mockUuid } from '@/tests/mocks/helpers.mock';

export function getAccountTokenMock(): AccountTokenEntity {
	return {
		id: 1,
		user_id: 1,
		ident: mockUuid(),
		created_at: createPastDate(28800),
		metadata: { 'user-agent': 'test-agent' },
		used_at: createPastDate(14400),
		expire_at: createFutureDate(14400),
	};
}

export function getAccountRecoveryMock(): AccountRecoveryEntity {
	return {
		id: 1,
		user_id: 1,
		ident: mockUuid(),
		created_at: createPastDate(28800),
		used_at: createPastDate(14400),
		expire_at: createFutureDate(14400),
	};
}

export function getAuthValidTokenMock(): AuthValidToken {
	return {
		ident: 'some_ident',
		label: 'Windows',
		used_at: createPastDate(7200),
		used_now: true,
	};
}

export function getAuthActiveTokenMock(): AccountTokenEntity {
	return {
		id: 1,
		user_id: 1,
		ident: mockUuid(),
		created_at: createPastDate(28800),
		used_at: createPastDate(14400),
		expire_at: createFutureDate(14400),
	};
}

export function getConfirmationTokenPayloadMock(): ConfirmationTokenPayload {
	return {
		user_id: 1,
		user_email: 'john.doe@example.com',
	};
}

export const accountInputPayloads = {
	register: {
		name: 'John Doe',
		email: 'john.doe@example.com',
		password: 'Secure@123',
		password_confirm: 'Secure@123',
		language: 'en',
	},
	login: {
		email: 'john.doe@example.com',
		password: 'Secure@123',
	},
	passwordRecover: {
		email: 'john.doe@example.com',
	},
	passwordRecoverChange: {
		// The controller merges `ident` from the path before validating, so the payload
		// the validator sees always carries it.
		ident: mockUuid(),
		password: 'Secure@123',
		password_confirm: 'Secure@123',
	},
	passwordUpdate: {
		password_current: 'Secure@123',
		password_new: 'NewStuff@123',
		password_confirm: 'NewStuff@123',
	},
	emailConfirmSend: {
		email: 'john.doe@example.com',
	},
	emailUpdate: {
		email_new: 'john.doe@example.com',
	},
	removeToken: {
		ident: mockUuid(),
	},
	meEdit: {
		name: 'John Doe',
		language: 'en',
	},
	meDelete: {
		password_current: 'Secure@123',
	},
};
