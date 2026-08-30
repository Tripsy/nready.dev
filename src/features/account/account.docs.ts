import { Configuration } from '@/config/settings.config';
import {
	accountInputPayloads,
	getAuthValidTokenMock,
} from '@/features/account/account.mock';
import type { AccountAction } from '@/features/account/account.routes';
import { AccountIdentityProviderEnum } from '@/features/account/account-identity.entity';
import {
	type ApiInputDocumentation,
	helperApiInputDocumentation,
} from '@/helpers/api-documentation.helper';
import { UserRoleEnum } from '@/shared/types/user-role.type';

/**
 * What a signed-in user does with their own account, mounted on `/account` beside the open half
 * in `account-public.docs.ts`.
 *
 * Every action takes a bearer token and none consults a permission entity: the token names the
 * user and each write targets that user alone, so `account` never appears in a permission grant
 * and a 403 here is about the token, not about a missing grant.
 */

const providerParam = {
	type: 'enum' as const,
	required: true,
	values: Object.values(AccountIdentityProviderEnum),
};

const passwordCondition = `at least ${Configuration.get('user.passwordMinChars')} characters, with a capital letter, a number and a special character`;

/** What `GET /account/me` echoes: the auth context the middleware resolved for the token. */
const authContextSample = {
	id: 1,
	email: 'john.doe@example.com',
	name: 'John Doe',
	language: 'en',
	role: UserRoleEnum.MEMBER,
	operator_type: null,
	permissions: {
		article: ['read', 'find'],
	},
	has_password: true,
	activeToken: getAuthValidTokenMock().ident,
};

export const docs: Record<AccountAction, ApiInputDocumentation> = {
	oauthList: helperApiInputDocumentation({
		description: 'List the providers linked to the current account',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Linked provider list',
			dataSample: [
				{
					provider: AccountIdentityProviderEnum.GOOGLE,
					email: 'john.doe@example.com',
					last_login_at: null,
				},
			] as unknown as Record<string, unknown>,
		},
		withAuthErrors: true,
		request: {
			notes: '`data` is the bare array, empty for an account that has linked none. `email` is what the provider reported when the link was made and is kept for auditing — it is not the account address and does not follow it',
		},
	}),
	oauthUnlink: helperApiInputDocumentation({
		description: 'Unlink a social provider from the current account',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Provider unlinked successfully',
		},
		withAuthErrors: true,
		withErrors: [404, 409, 422],
		request: {
			notes: 'A provider that is not linked answers 404. Unlinking the last one answers 409 while the account has no password, since that would leave no way back in — set a password through password recovery first. The link is removed outright rather than soft-deleted, so the same provider can be linked again',
			params: {
				provider: providerParam,
			},
		},
	}),
	logout: helperApiInputDocumentation({
		description: 'Sign out of the current session',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Logged out successfully',
		},
		withAuthErrors: true,
		withErrors: [400],
		request: {
			notes: "Revokes the token the request was made with and leaves this account's other sessions alone — use `DELETE /account/token` to end one of those",
		},
	}),
	passwordUpdate: helperApiInputDocumentation({
		description: 'Change the password of the current account',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'User password updated successfully',
			dataSample: {
				token: 'a.jwt.token',
			},
		},
		withAuthErrors: true,
		withErrors: [400, 422],
		request: {
			notes: "A fresh token is issued and returned; the token the request was made with stays valid, as do the account's other sessions. A wrong `password_current` answers 400 with the message under `errors`, and an account created through social sign-in has none to send and answers 400 as well: it sets its first password through password recovery",
			body: {
				password_current: { type: 'string', required: true },
				password_new: {
					type: 'string',
					required: true,
					condition: passwordCondition,
				},
				password_confirm: {
					type: 'string',
					required: true,
					condition: 'must match password_new',
				},
			},
			sample: accountInputPayloads.passwordUpdate,
		},
	}),
	emailUpdate: helperApiInputDocumentation({
		description: 'Request an email address change',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Follow email confirmation instructions',
		},
		withAuthErrors: true,
		withErrors: [404, 409, 422],
		request: {
			notes: 'Changes nothing on its own: the new address only lands once the link sent to it is redeemed through `POST /account/email-confirm/:token`, which is what proves the user reaches that mailbox. An address already registered to another account answers 409',
			body: {
				email_new: { type: 'string', format: 'email', required: true },
			},
			sample: accountInputPayloads.emailUpdate,
		},
	}),
	meDetails: helperApiInputDocumentation({
		description: 'Read the account behind the current token',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Account details',
			dataSample: authContextSample,
		},
		withAuthErrors: true,
		request: {
			notes: "Echoes the auth context resolved for the token rather than reading the user row, so it is the cheapest way to check a token is still live and to learn what it may do. `permissions` maps a permission entity to the operations granted on it and is empty for an admin, who is allowed everything without a grant. `has_password` is false for a social sign-in account that has never set one, and `activeToken` is this session's ident — the one `GET /account/me/sessions` marks `used_now`",
		},
	}),
	meSessions: helperApiInputDocumentation({
		description: 'List the active sessions of the current account',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Active session list',
			dataSample: [getAuthValidTokenMock()] as unknown as Record<
				string,
				unknown
			>,
		},
		withAuthErrors: true,
		request: {
			notes: '`data` is the bare array, expired sessions already dropped. `label` is the user agent recorded when the session started, `used_now` marks the one making this request, and `ident` is what `DELETE /account/token` takes to revoke one',
		},
	}),
	meEdit: helperApiInputDocumentation({
		description: 'Update the current account',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Account updated successfully',
		},
		withAuthErrors: true,
		withErrors: [404, 422],
		request: {
			notes: "The two fields a user owns outright. Email goes through `POST /account/email-update` and password through `POST /account/password-update`, since both have to be proven; status and role are not the account holder's to set at all",
			body: {
				name: {
					type: 'string',
					required: true,
					condition: `at least ${Configuration.get('user.nameMinChars')} characters`,
				},
				language: {
					type: 'enum',
					required: false,
					values: Configuration.get('language.supported'),
				},
			},
			sample: accountInputPayloads.meEdit,
		},
	}),
	meDelete: helperApiInputDocumentation({
		description: 'Delete the current account',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Account deleted successfully',
		},
		withAuthErrors: true,
		withErrors: [400, 404, 422],
		request: {
			notes: 'Soft delete — the row stays and only an administrator can bring it back. `password_current` is required whenever the account has a password and a wrong one answers 400; a social sign-in account that has never set one sends nothing, the bearer token being the same bar every other `/me` endpoint clears',
			body: {
				password_current: {
					type: 'string',
					required: false,
					condition: 'required unless the account has no password',
				},
			},
			sample: accountInputPayloads.meDelete,
		},
	}),
};
