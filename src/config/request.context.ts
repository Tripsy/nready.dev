import { AsyncLocalStorage } from 'node:async_hooks';

export const RequestContextSourceEnum = {
	CRON: 'cron',
	API: 'api',
	SEED: 'seed',
	UNKNOWN: 'unknown',
} as const;

export type RequestContextSource =
	(typeof RequestContextSourceEnum)[keyof typeof RequestContextSourceEnum];

export type RequestContext = {
	auth_id: number;
	performed_by: string;
	request_id: string;
	source: RequestContextSource;
	language: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();
