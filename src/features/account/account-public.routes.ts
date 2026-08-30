import {
	authDefaultRateLimiter,
	authLoginRateLimiter,
} from '@/config/rate-limit.config';
import type { accountController } from '@/features/account/account.controller';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

/**
 * The half of the account feature a visitor can call without a token — the ways into an
 * account and the links emailed out of it.
 *
 * Open is not the same as anonymous: `register`, `login`, `oauthLogin`, `passwordRecover`,
 * `passwordRecoverChange` and `emailConfirmSend` refuse a caller who already holds one, so a
 * 403 here means "you are signed in". `removeToken` and `emailConfirm` accept either, because
 * the credential they act on is the ident or the signed token they carry.
 *
 * Split from `account.routes.ts` so each module reports one authorization state rather
 * than a mixed one. Both mount on `/account` and share `accountController`: the two halves are
 * one conversation about the same account, and `login` and `oauthLogin` answer identically
 * because they call the same private token issuer.
 */
export type AccountPublicAction =
	| 'register'
	| 'login'
	| 'oauthLogin'
	| 'removeToken'
	| 'passwordRecover'
	| 'passwordRecoverChange'
	| 'emailConfirm'
	| 'emailConfirmSend';

export default async () => {
	const { accountController } = await import(
		'@/features/account/account.controller'
	);

	const config: FeatureRoutesModule<
		Pick<typeof accountController, AccountPublicAction>
	> = {
		basePath: '/account',
		controller: accountController,
		routes: {
			register: {
				path: '/register',
				method: 'post',
				handlers: [authDefaultRateLimiter],
			},
			login: {
				path: '/login',
				method: 'post',
				handlers: [authLoginRateLimiter],
			},
			// Social sign-in: the frontend runs the browser redirect and posts the
			// resulting authorization code here. Rate-limited as a login, because that is
			// what it is.
			oauthLogin: {
				path: '/oauth/:provider',
				method: 'post',
				handlers: [authLoginRateLimiter],
			},
			removeToken: {
				path: '/token',
				method: 'delete',
			},
			passwordRecover: {
				path: '/password-recover',
				method: 'post',
				handlers: [authDefaultRateLimiter],
			},
			passwordRecoverChange: {
				path: '/password-recover-change/:ident',
				method: 'post',
			},
			emailConfirm: {
				path: '/email-confirm/:token',
				method: 'post',
			},
			emailConfirmSend: {
				path: '/email-confirm-send',
				method: 'post',
				handlers: [authDefaultRateLimiter],
			},
		},
	};

	return config;
};
