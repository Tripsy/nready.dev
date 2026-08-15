export const LogHistoryActionEnum = {
	CREATED: 'created',
	UPDATED: 'updated',
	DELETED: 'deleted',
	REMOVED: 'removed',
	RESTORED: 'restored',
	STATUS: 'status',
	VISIBILITY: 'visibility',
	FEATURED_EXPIRED: 'featured_expired',
	PASSWORD_CHANGE: 'password_change',
} as const;

export type LogHistoryAction =
	(typeof LogHistoryActionEnum)[keyof typeof LogHistoryActionEnum];

export type LogHistoryDestination = 'pino' | 'db' | null;
