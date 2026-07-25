import 'dotenv/config';
import { hostname } from 'node:os';
import { getObjectValue, type ObjectValue, setObjectValue } from '@/helpers';
import type { LogDataLevel } from '@/shared/types/log-data.type';
import type { LogHistoryDestination } from '@/shared/types/log-history.type';

type Settings = { [key: string]: ObjectValue };

function loadSettings(): Settings {
	// Read directly from `process.env` rather than through `Configuration`: these decide
	// values inside the settings object being built, so it does not exist yet.
	const environment = process.env.APP_ENV || 'development';
	const isProduction = environment === 'production';
	const isVerbose =
		process.env.APP_DEBUG === 'true' || environment === 'test';

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
			currency: process.env.APP_CURRENCY || 'RON',
		},
		language: {
			default: process.env.APP_LANGUAGE_DEFAULT || 'ro',
			supported: (process.env.APP_LANGUAGE_SUPPORTED || 'ro,en')
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
		/*
		 * Each `level*` array is the set of levels one destination accepts; an empty array
		 * means that destination is not built at all (see `log-destinations.factory.ts`).
		 */
		logging: {
			logLevel: process.env.PINO_LOG_LEVEL || ('trace' as LogDataLevel),
			levelConsole: (isVerbose
				? ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
				: []) as LogDataLevel[],
			// Production hosts are ephemeral, so rotating files on disk buy nothing and
			// are lost with the instance — CloudWatch replaces them there.
			levelFile: (isProduction
				? []
				: [
						'debug',
						'info',
						'error',
						'warn',
						'fatal',
					]) as LogDataLevel[],
			levelDatabase: ['info', 'error', 'warn', 'fatal'] as LogDataLevel[],
			// Only `fatal` by default: this channel was silently broken until now, and
			// error-level volume would make it noise. Widen it here if you want it back.
			levelEmail: ['fatal'] as LogDataLevel[],
			// Not gated on environment — the destination is skipped unless a log group is
			// configured, so setting AWS_CLOUDWATCH_LOG_GROUP is enough to try it in dev.
			levelCloudWatch: [
				'info',
				'warn',
				'error',
				'fatal',
			] as LogDataLevel[],
			logEmail: process.env.PINO_LOG_EMAIL || '',
			history: process.env.LOGGING_HISTORY as LogHistoryDestination,
		},
		aws: {
			region: process.env.AWS_REGION || '',
			cloudwatch: {
				logGroup: process.env.AWS_CLOUDWATCH_LOG_GROUP || '',
				// One stream per host keeps concurrent writers off a shared stream.
				logStream: process.env.AWS_CLOUDWATCH_LOG_STREAM || hostname(),
			},
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
			nameMinChars: 3,
			passwordMinChars: 8,
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

	environment: () => {
		return Configuration.get('app.environment') as string;
	},

	isEnvironment: (value: string) => {
		return Configuration.environment() === value;
	},

	language: () => {
		return Configuration.get('language.default') as string;
	},

	isSupportedLanguage: (language: string): boolean => {
		const languages = Configuration.get<string[]>('language.supported');

		return Array.isArray(languages) && languages.includes(language);
	},

	currency: () => {
		return Configuration.get('app.currency') as string;
	},

	resolveExtension: () => {
		return Configuration.environment() === 'production' ? 'js' : 'ts';
	},
};
