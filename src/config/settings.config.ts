import 'dotenv/config';
import { getObjectValue, type ObjectValue, setObjectValue } from '@/helpers';
import type { LogDataLevelEnum } from '@/shared/types/log-data.type';
import type { LogHistoryDestination } from '@/shared/types/log-history.type';

type Settings = { [key: string]: ObjectValue };

function loadSettings(): Settings {
	return {
		app: {
			environment: process.env.APP_ENV || 'development',
			debug: process.env.APP_DEBUG === 'true',
			url: process.env.APP_URL || 'http://nready.test',
			port: parseInt(process.env.APP_PORT || '3000', 10),
			port_while_testing: parseInt(
				process.env.APP_PORT_WHILE_TESTING || '3001',
				10,
			),
			name: process.env.APP_NAME || 'sample-node-api',
			email: process.env.APP_EMAIL || 'hello@example.com',
			timezone: process.env.APP_TIMEZONE || 'UTC',
			language: process.env.APP_LANGUAGE || 'en',
			languageSupported: (process.env.APP_LANGUAGE_SUPPORTED || 'en')
				.trim()
				.split(','),
		},
		folder: {
			features: '/features',
			shared: '/shared',
		},
		frontend: {
			url: process.env.FRONTEND_URL || 'http://dashboard.test',
			name: process.env.FRONTEND_APP_NAME || 'sample-nextjs-client',
		},
		security: {
			allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map((v) =>
				v.trim(),
			) || ['http://localhost'],
		},
		redis: {
			host: process.env.REDIS_HOST || 'localhost',
			port: parseInt(process.env.REDIS_PORT || '6379', 10),
			password: process.env.REDIS_PASSWORD || '',
		},
		cache: {
			ttl: Number(process.env.CACHE_TTL) ?? 60,
		},
		logging: {
			logLevel:
				process.env.PINO_LOG_LEVEL || ('trace' as LogDataLevelEnum),
			levelFile: [
				'debug',
				'info',
				'error',
				'warn',
				'fatal',
			] as LogDataLevelEnum[],
			levelDatabase: [
				'info',
				'error',
				'warn',
				'fatal',
			] as LogDataLevelEnum[],
			levelEmail: ['error', 'fatal'] as LogDataLevelEnum[],
			logEmail: process.env.PINO_LOG_EMAIL || '',
			history: process.env.LOGGING_HISTORY as LogHistoryDestination,
		},
		mail: {
			provider: process.env.MAIL_PROVIDER || 'smtp', // 'smtp' or 'ses'
			from: {
				name: process.env.MAIL_FROM_NAME || 'NReady',
				address: process.env.MAIL_FROM_ADDRESS || 'engine@play-zone.ro',
			},
			host: process.env.MAIL_HOST,
			port: parseInt(process.env.MAIL_PORT || '2525', 10),
			encryption: process.env.MAIL_ENCRYPTION === 'true',
			username: process.env.MAIL_USERNAME || '',
			password: process.env.MAIL_PASSWORD || '',
		},
		filter: {
			limit: 20,
			termMinLength: 3,
		},
		user: {
			authSecret: (process.env.AUTH_JWT_SECRET as string) || 'secret',
			authExpiresIn: Number(process.env.AUTH_JWT_EXPIRES_IN) || 86400,
			authRefreshExpiresIn:
				Number(process.env.AUTH_JWT_REFRESH_EXPIRES_IN) || 28800,
			emailConfirmationSecret:
				(process.env.EMAIL_JWT_SECRET as string) || 'secret',
			emailConfirmationExpiresIn:
				Number(process.env.EMAIL_JWT_EXPIRES_IN) || 30,
			maxActiveSessions: 2,
			recoveryIdentExpiresIn: 7200,
			recoveryAttemptsInLastSixHours: 3,
			recoveryEnableMetadataCheck: true,
			nameMinLength: 3,
			passwordMinLength: 8,
			loginMaxFailedAttemptsForIp: 5,
			loginMaxFailedAttemptsForEmail: 3,
			loginFailedAttemptsLockTime: 900,
		},
	};
}

export const Configuration = {
	get: <T = ObjectValue>(key: string): T | undefined => {
		const value = getObjectValue(loadSettings(), key);

		if (value === undefined) {
			console.warn(`Configuration key not found: ${key}`);
		}

		return value as T;
	},

	set: (key: string, value: ObjectValue): void => {
		const success = setObjectValue(loadSettings(), key, value);

		if (!success) {
			console.warn(`Failed to set configuration key: ${key}`);
		}
	},

	isSupportedLanguage: (language: string): boolean => {
		const languages = Configuration.get<string[]>('app.languageSupported');

		return Array.isArray(languages) && languages.includes(language);
	},

	environment: () => {
		return Configuration.get('app.environment') as string;
	},

	isEnvironment: (value: string) => {
		return Configuration.environment() === value;
	},

	resolveExtension: () => {
		return Configuration.environment() === 'production' ? 'js' : 'ts';
	},
};
