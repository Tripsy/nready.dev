import {
	authDefaultRateLimiter,
	authLoginRateLimiter,
} from '@/config/rate-limit.config';
import type { FeatureRoutesModule } from '@/config/routes.setup';
import { accountController } from '@/features/account/account.controller';

const routesModule: FeatureRoutesModule<typeof accountController> = {
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
		removeToken: {
			path: '/token',
			method: 'delete',
		},
		logout: {
			path: '/logout',
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
		passwordUpdate: {
			path: '/password-update',
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

const routesConfiguration: FeatureRoutesModule<typeof accountController> = {
	...routesModule,
};

export default routesConfiguration;
