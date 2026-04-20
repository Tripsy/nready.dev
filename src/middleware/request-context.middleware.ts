import type { NextFunction, Request, Response } from 'express';
import {
	RequestContextSourceEnum,
	requestContext,
} from '@/config/request.context';

export function requestContextMiddleware(
	_req: Request,
	res: Response,
	next: NextFunction,
) {
	requestContext.run(
		{
			auth_id: res.locals.auth?.id || 0,
			performed_by: res.locals.auth?.name || 'unknown',
			request_id: res.locals.request_id,
			source: RequestContextSourceEnum.API,
			language: res.locals.language,
		},
		() => next(),
	);
}
