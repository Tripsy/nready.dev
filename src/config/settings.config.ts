import 'dotenv/config';
import { hostname } from 'node:os';
import { getObjectValue, type ObjectValue } from '@/helpers';
import type { LogDataLevel } from '@/shared/types/log-data.type';
import type { LogHistoryDestination } from '@/shared/types/log-history.type';

/**
 * Deliberately un-annotated so TypeScript infers the literal shape of the returned object.
 * That inferred shape is what gives `Configuration.get()` its key union and return types —
 * annotating this `: Settings` would widen everything to `ObjectValue` and lose both.
 */
function loadSettings() {
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

type Settings = ReturnType<typeof loadSettings>;

/**
 * Every valid dotted path into `Settings`, as a union of string literals.
 *
 * Arrays stop the recursion — `logging.levelFile` is a leaf, there is no
 * `logging.levelFile.0`. `NonNullable` lets an optional branch (`mail.host` is
 * `string | undefined`) still be classified by its non-undefined type.
 */
export type SettingsKey<T = Settings> = {
	[K in keyof T & string]: T[K] extends readonly unknown[]
		? K
		: NonNullable<T[K]> extends object
			? K | `${K}.${SettingsKey<NonNullable<T[K]>>}`
			: K;
}[keyof T & string];

/** The type stored at a given dotted path. */
export type SettingsValue<
	K extends string,
	T = Settings,
> = K extends `${infer Head}.${infer Rest}`
	? Head extends keyof T
		? SettingsValue<Rest, NonNullable<T[Head]>>
		: never
	: K extends keyof T
		? T[K]
		: never;

/**
 * Settings are derived once, on first read, and reused.
 *
 * `loadSettings()` is not cheap — it re-reads ~40 environment variables, runs `parseInt`
 * and `split` over them and calls `hostname()` — and it used to run on *every*
 * `Configuration.get()`. Boot alone did ~1000 of them. Nothing here can change after the
 * process starts (`dotenv/config` is imported at the top of this module, before any
 * reader), so rebuilding per read bought nothing.
 *
 * Caching also makes `set()` work: it previously mutated a throwaway object that was
 * discarded on return, so writes were silently lost.
 */
let settings: Settings | undefined;

function getSettings(): Settings {
	settings ??= loadSettings();

	return settings;
}

export const Configuration = {
	/**
	 * Reads a setting by dotted path. The path is checked against the shape of
	 * `loadSettings()`, so a typo is a compile error rather than an `undefined` at runtime,
	 * and the return type is inferred — no `as string` needed at the call site.
	 */
	get: <K extends SettingsKey>(key: K): SettingsValue<K> => {
		const value = getObjectValue(
			getSettings() as Record<string, ObjectValue>,
			key,
		);

		if (value === undefined) {
			// Unreachable for a well-typed key unless the value is genuinely optional
			// (eg: `mail.host`); kept as a guard for dynamic paths.
			console.warn(`Configuration key not found: ${key}`);
		}

		return value as SettingsValue<K>;
	},

	// Currently unused
	// set: <K extends SettingsKey>(key: K, value: SettingsValue<K>): void => {
	// 	const success = setObjectValue(
	// 		getSettings() as Record<string, ObjectValue>,
	// 		key,
	// 		value as ObjectValue,
	// 	);
	//
	// 	if (!success) {
	// 		console.warn(`Failed to set configuration key: ${key}`);
	// 	}
	// },

	// These read the cached object directly rather than going through `get()`. They are
	// the hottest paths — every `lang()` call hits `isEnvironment` — and this skips the
	// dotted-path split, the lookup and the undefined check for a plain property read.
	environment: () => {
		return getSettings().app.environment;
	},

	isEnvironment: (value: string) => {
		return getSettings().app.environment === value;
	},

	language: () => {
		return getSettings().language.default;
	},

	isSupportedLanguage: (language: string): boolean => {
		return getSettings().language.supported.includes(language);
	},

	currency: () => {
		return getSettings().app.currency;
	},

	resolveExtension: () => {
		return Configuration.environment() === 'production' ? 'js' : 'ts';
	},

	/**
	 * Drops the cache so the next read re-derives from `process.env`.
	 * Only for tests that need to exercise a different environment.
	 */
	reset: (): void => {
		settings = undefined;
	},
};
