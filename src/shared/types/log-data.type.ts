export const LogDataCategoryEnum = {
	SYSTEM: 'system',
	HISTORY: 'history',
	CRON: 'cron',
	INFO: 'info',
	ERROR: 'error',
} as const;

export type LogDataCategory =
	(typeof LogDataCategoryEnum)[keyof typeof LogDataCategoryEnum];

export const LogDataLevelEnum = {
	TRACE: 'trace', // 10
	DEBUG: 'debug', // 20
	INFO: 'info', // 30
	WARN: 'warn', // 40
	ERROR: 'error', // 50
	FATAL: 'fatal', // 60
} as const;

export type LogDataLevel =
	(typeof LogDataLevelEnum)[keyof typeof LogDataLevelEnum];
