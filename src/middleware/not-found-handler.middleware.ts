import type { NextFunction, Request, Response } from 'express';
import { Configuration } from '@/config/settings.config';
import { getSystemLogger } from '@/providers/logger.provider';

export const notFoundHandler = (
	req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	/*
	 * Gated on `app.debug`, matching how `errorHandler` already treats a 404 (it excludes
	 * [400, 401, 403, 404, 409] unless debug is on). This handler never routed through it,
	 * so it kept logging at `error` level — which `levelDatabase` persists to `log_data`
	 * and `levelCloudWatch` ships off-instance.
	 *
	 * That made an unauthenticated stranger the author of rows in our database: a public
	 * hostname attracts continuous vulnerability scanning (/wp-admin, /.env, /.git/config),
	 * and every probe became an error row on the instance's volume. A 404 is an expected
	 * outcome, not a fault worth recording in production.
	 */
	if (Configuration.get('app.debug')) {
		getSystemLogger().error(
			{
				request: {
					method: req.method,
					url: req.originalUrl,
				},
			},
			'Not Found',
		);
	}

	res.locals.output.success(false).message('Not Found');

	res.status(404).json(res.locals.output);
};
