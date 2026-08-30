import { describeRateLimit } from '@/config/rate-limit.config';
import { Configuration } from '@/config/settings.config';
import { accountInputPayloads } from '@/features/account/account.mock';
import { AccountIdentityProviderEnum } from '@/features/account/account-identity.entity';
import type { AccountPublicAction } from '@/features/account/account-public.routes';
import { getUserEntityMock } from '@/features/user/user.mock';
import {
	type ApiInputDocumentation,
	helperApiInputDocumentation,
} from '@/helpers/api-documentation.helper';

/**
 * The ways into an account and the links emailed out of it: registration, password and social
 * sign-in, password recovery, email confirmation, and revoking a session by its ident. What a
 * signed-in user then does with the account is `account.docs.ts`, mounted on the same
 * `/account` base path.
 *
 * Open is not the same as anonymous. `register`, `login`, `oauthLogin`, `passwordRecover`,
 * `passwordRecoverChange` and `emailConfirmSend` refuse a caller who already holds a token, so a
 * 403 here means "you are signed in", not "you are not allowed"; `removeToken` and `emailConfirm`
 * accept either, because the ident or signed token they carry is the credential they act on.
 *
 * No action here consults a permission entity: `account` never appears in a permission grant.
 */

const providerParam = {
	type: 'enum' as const,
	required: true,
	values: Object.values(AccountIdentityProviderEnum),
};

const passwordCondition = `at least ${Configuration.get('user.passwordMinChars')} characters, with a capital letter, a number and a special character`;

const identParam = {
	type: 'string' as const,
	required: true,
	format: 'uuid',
};

/**
 * Rate-limited endpoints answer 429 with the limiter's own body — `{ status, error, message }`
 * — instead of the wrapper every other response uses, because the limiter replies before the
 * route runs. Stated in the notes rather than listed as a response for that reason.
 */
function rateLimitNote(type: 'authLogin' | 'authDefault'): string {
	return `Rate-limited to ${describeRateLimit(type)}; over the budget the limiter answers 429 with its own \`{ status, error, message }\` body, not the usual wrapper`;
}

/**
 * `password` is `select: false` on the entity, so it is never read back; the mock carries one
 * because it types as the full `UserEntity`.
 */
function getUserResponseSample(): Record<string, unknown> {
	const { password: _password, ...user } = getUserEntityMock();

	return user as unknown as Record<string, unknown>;
}

const maxSessionsNote = `Both sign-in endpoints stop at ${Configuration.get('user.maxActiveSessions')} active sessions: instead of a token they answer 403 carrying \`authTokens\`, the list this account can revoke through \`DELETE /account/token\` before retrying. The credentials were already accepted at that point, so a 403 here does not mean they were wrong`;

export const docs: Record<AccountPublicAction, ApiInputDocumentation> = {
	register: helperApiInputDocumentation({
		description: 'Register a new account',
		success: {
			status: 201,
			description: 'Account registered successfully',
			dataSample: getUserResponseSample(),
		},
		withErrors: [400, 403, 409, 422],
		request: {
			notes: `The account is created pending and cannot sign in until the emailed confirmation link is redeemed. An email already registered answers 409 while that account is still pending — it can be resent through \`POST /account/email-confirm-send\` — and 400 once it is active. \`language\` falls back to the language the request was resolved in. ${rateLimitNote('authDefault')}`,
			body: {
				name: {
					type: 'string',
					required: true,
					condition: `at least ${Configuration.get('user.nameMinChars')} characters`,
				},
				email: { type: 'string', format: 'email', required: true },
				password: {
					type: 'string',
					required: true,
					condition: passwordCondition,
				},
				password_confirm: {
					type: 'string',
					required: true,
					condition: 'must match password',
				},
				language: {
					type: 'enum',
					required: false,
					values: Configuration.get('language.supported'),
				},
			},
			sample: accountInputPayloads.register,
		},
	}),
	login: helperApiInputDocumentation({
		description: 'Sign in with an email and password',
		success: {
			status: 200,
			description: 'Logged in successfully',
			dataSample: {
				token: 'a.jwt.token',
			},
		},
		withErrors: [400, 401, 403, 404, 409, 422],
		request: {
			notes: `The token is returned in the body — nothing is set as a cookie, and the caller decides where to keep it. An unknown, deleted or inactive account answers 404 and a pending one 409, so the response never distinguishes a wrong password (401) from an address that was never registered. An account created through social sign-in has no password and answers 400. ${maxSessionsNote}. ${rateLimitNote('authLogin')}`,
			body: {
				email: { type: 'string', format: 'email', required: true },
				password: { type: 'string', required: true },
			},
			sample: accountInputPayloads.login,
		},
	}),
	oauthLogin: helperApiInputDocumentation({
		description: 'Sign in with a social provider',
		success: {
			status: 200,
			description: 'Logged in successfully',
			dataSample: {
				token: 'a.jwt.token',
			},
		},
		withErrors: [400, 403, 404, 409, 422, 501, 502],
		request: {
			notes: `Registration and sign-in are one endpoint: the provider does not say which the user meant. The caller runs the browser redirect and posts the resulting authorization code here, so the client secret stays server-side; \`redirect_uri\` has to be the one the code was issued for and is checked against the addresses this deployment allows. The provider is matched on its subject id, not on the email, so an address changed at the provider still resolves to the same account. A provider without credentials configured here answers 501, and a provider that could not be reached 502. ${maxSessionsNote}`,
			params: {
				provider: providerParam,
			},
			body: {
				code: {
					type: 'string',
					required: true,
					condition:
						'the authorization code the provider returned to the redirect uri',
				},
				redirect_uri: { type: 'string', required: true },
				language: {
					type: 'enum',
					required: false,
					values: Configuration.get('language.supported'),
					condition: 'only used when the account is created here',
				},
			},
			sample: accountInputPayloads.oauthLogin,
		},
	}),
	removeToken: helperApiInputDocumentation({
		description: 'Revoke one session token',
		success: {
			status: 200,
			description: 'Token deleted successfully',
		},
		withErrors: [422],
		request: {
			notes: 'Takes no bearer token, because the case it exists for is a sign-in that was refused: the 403 from `login` hands back the idents this account can revoke, and none of them can be presented as auth. Knowing an ident is the whole credential, which is why it is an unguessable uuid and never leaves the account it belongs to. An ident that matches nothing is a success — the session is gone either way',
			body: {
				ident: identParam,
			},
			sample: accountInputPayloads.removeToken,
		},
	}),
	passwordRecover: helperApiInputDocumentation({
		description: 'Request a password recovery email',
		success: {
			status: 200,
			description: 'Password recover email sent successfully',
		},
		withErrors: [403, 404, 422, 425],
		request: {
			notes: `Emails a single-use link that expires. An unknown or inactive account answers 404, so the response does say whether the address is registered. ${Configuration.get('user.recoveryAttemptsInLastSixHours')} requests in six hours answer 425 until the oldest lapses, which is a per-account counter and separate from the rate limit below. The email is sent in the background, so a 200 reports the request was accepted rather than that the message was delivered. ${rateLimitNote('authDefault')}`,
			body: {
				email: { type: 'string', format: 'email', required: true },
			},
			sample: accountInputPayloads.passwordRecover,
		},
	}),
	passwordRecoverChange: helperApiInputDocumentation({
		description: 'Set a new password from a recovery link',
		success: {
			status: 200,
			description: 'Password changed successfully',
		},
		withErrors: [400, 403, 404, 422],
		request: {
			notes: `The \`ident\` is the uuid from the emailed link. It is single-use and answers 400 once redeemed or expired${Configuration.get('user.recoveryEnableMetadataCheck') ? ', and this deployment also requires the link to be opened from the same user agent that asked for it' : ''}. Succeeding drops the account's other outstanding recovery links but leaves its existing sessions signed in, so a session already open keeps working under the new password. This is also how a social sign-in account gains its first password`,
			params: {
				ident: identParam,
			},
			body: {
				password: {
					type: 'string',
					required: true,
					condition: passwordCondition,
				},
				password_confirm: {
					type: 'string',
					required: true,
					condition: 'must match password',
				},
			},
			sample: accountInputPayloads.passwordRecoverChange,
		},
	}),
	emailConfirm: helperApiInputDocumentation({
		description: 'Confirm an email address from a confirmation link',
		success: {
			status: 200,
			description: 'Email confirmed successfully',
		},
		withErrors: [400, 403, 404, 422],
		request: {
			notes: 'Serves both flows the confirmation email is sent for, told apart by what the token carries: a registration confirmation activates the pending account, while an email-update confirmation writes the new address. Takes no bearer token — a user may well be signed in when they click it, and it is the signed token that authorizes the change. An expired or tampered token, and a token whose address no longer matches the account, answer 400; an already active account answers 400 and a disabled one 403',
			params: {
				token: {
					type: 'string',
					required: true,
					format: 'jwt',
					condition:
						'url-encoded in the link; decoded before it is verified',
				},
			},
		},
	}),
	emailConfirmSend: helperApiInputDocumentation({
		description: 'Resend the registration confirmation email',
		success: {
			status: 200,
			description: 'Confirmation email sent with success',
		},
		withErrors: [400, 403, 422],
		request: {
			notes: `Only for an account still waiting on its first confirmation: an unknown or deleted address answers 400 and an account that is already active or disabled answers 403. ${rateLimitNote('authDefault')}`,
			body: {
				email: { type: 'string', format: 'email', required: true },
			},
			sample: accountInputPayloads.emailConfirmSend,
		},
	}),
};
