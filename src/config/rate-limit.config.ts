import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { lang } from '@/config/message.setup';

const ipsAllowlist = ['192.168.0.56', '192.168.0.21'];

type RateLimiterType = 'api' | 'authLogin' | 'authDefault';

const instances = new Map<RateLimiterType, ReturnType<typeof rateLimit>>();

const baseConfig = {
	windowMs: 15 * 60 * 1000,
	limit: 150,
	legacyHeaders: false,
	standardHeaders: 'draft-6' as const,
	skip: (req: Request) => ipsAllowlist.includes(req.ip || ''),
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
