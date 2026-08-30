import rateLimit from 'express-rate-limit';
import { lang } from '@/config/message.setup';
import { Configuration } from '@/config/settings.config';

export type RateLimiterType = 'api' | 'authLogin' | 'authDefault';

const instances = new Map<RateLimiterType, ReturnType<typeof rateLimit>>();

const baseConfig = {
	windowMs: 15 * 60 * 1000,
	limit: 150,
	legacyHeaders: false,
	standardHeaders: 'draft-6' as const,
	/*
	 * Disabled under `test`, like `authMiddleware` in `app.ts`.
	 *
	 * One limiter instance is cached per type, so `register`, `passwordRecover` and
	 * `emailConfirmSend` all share a single 10-per-15-minutes budget. In a suite that
	 * counter carries across every test in the file, which makes results depend on how
	 * many requests ran before — adding a case anywhere can push an unrelated one into a
	 * 429. Nothing asserts rate-limiting behavior, so there is nothing to lose by
	 * skipping it.
	 *
	 * `test` is the only exemption. An address allowlist would be one a caller can put
	 * themselves on: in production `req.ip` is read from `X-Forwarded-For`, so naming a
	 * listed address in that header switches rate limiting off for exactly the callers it
	 * exists to catch.
	 */
	skip: () => Configuration.isEnvironment('test'),
};

const configs: Record<
	RateLimiterType,
	typeof baseConfig & { message: string; limit?: number }
> = {
	api: {
		...baseConfig,
		message: 'shared.rate_limit.message.default',
	},
	authLogin: {
		...baseConfig,
		limit: 10,
		message: 'shared.rate_limit.message.login',
	},
	authDefault: {
		...baseConfig,
		limit: 10,
		message: 'shared.rate_limit.message.default',
	},
};

/**
 * The limiter's budget in words, for the API documentation.
 *
 * Read off `configs` rather than restated in the docs files, so raising a limit here also
 * corrects what the published reference promises.
 */
export function describeRateLimit(type: RateLimiterType): string {
	const { limit, windowMs } = configs[type];

	return `${limit} requests per ${windowMs / 60000} minutes per IP address`;
}

export function getRateLimiter(type: RateLimiterType = 'api') {
	const existing = instances.get(type);

	if (existing) {
		return existing;
	}

	const limiter = rateLimit({
		...configs[type],
		message: async () => ({
			status: 429,
			error: lang('shared.rate_limit.error'),
			message: lang(configs[type].message),
		}),
	});

	instances.set(type, limiter);

	return limiter;
}

export const apiRateLimiter = getRateLimiter('api');
export const authLoginRateLimiter = getRateLimiter('authLogin');
export const authDefaultRateLimiter = getRateLimiter('authDefault');
