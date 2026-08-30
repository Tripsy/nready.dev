import type { accountController } from '@/features/account/account.controller';
import type { AccountPublicAction } from '@/features/account/account-public.routes';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

/**
 * What a signed-in user does with their own account: read the session, list and end sessions,
 * change the name, password or email, manage linked providers, delete the account.
 *
 * Every action requires a bearer token and none consults a permission entity — the token names
 * the user and each write targets that user alone, so `account` never appears in a grant.
 *
 * The complement of `account-public.routes.ts`, derived rather than restated: an action added
 * to the controller and to neither module fails to compile here, which is the only thing that
 * keeps a split feature from quietly losing a route.
 */
export type AccountAction = Exclude<
	keyof typeof accountController,
	AccountPublicAction
>;

export default async () => {
	const { accountController } = await import(
		'@/features/account/account.controller'
	);

	const config: FeatureRoutesModule<
		Pick<typeof accountController, AccountAction>
	> = {
		basePath: '/account',
		controller: accountController,
		routes: {
			oauthList: {
				path: '/oauth',
				method: 'get',
			},
			oauthUnlink: {
				path: '/oauth/:provider',
				method: 'delete',
			},
			logout: {
				path: '/logout',
				method: 'delete',
			},
			passwordUpdate: {
				path: '/password-update',
				method: 'post',
			},
			emailUpdate: {
				path: '/email-update',
				method: 'post',
			},
			meDetails: {
				path: '/me',
				method: 'get',
			},
			meSessions: {
				path: '/me/sessions',
				method: 'get',
			},
			meEdit: {
				path: '/me/edit',
				method: 'post',
			},
			meDelete: {
				path: '/me/delete',
				method: 'delete',
			},
		},
	};

	return config;
};
