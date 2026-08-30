import type { NextFunction, Request, Response } from 'express';
import { Configuration } from '@/config/settings.config';
import { UnauthorizedError } from '@/exceptions';
import { matchesAnySecret } from '@/helpers/security.helper';
import { getSystemLogger } from '@/providers/logger.provider';

export const CLIENT_KEY_HEADER = 'x-api-key';

/**
 * Paths answered without a key, matched exactly.
 *
 * Both are liveness probes read by the container runtime and the dev-stack script, neither
 * of which carries app configuration, and neither exposes anything a caller could not learn
 * by watching the port answer at all.
 */
const EXEMPT_PATHS: ReadonlySet<string> = new Set(['/health', '/ready']);

/**
 * The gate that makes this API private to its configured clients.
 *
 * CORS cannot do this job: `corsHandler` allows any request that arrives without an `Origin`
 * header, which is every request that does not come from a browser — so `curl` reaches the
 * reader-facing `/public/...` modules unchallenged. That header is a browser-enforced policy,
 * not a server-side check, and treating it as one leaves the open half of the API open.
 *
 * Mounted before the body parsers, so an unkeyed caller is refused before a 10mb body is read
 * off the wire. The cost is that `res.locals.output` does not exist yet and the rejection is
 * therefore answered by `errorHandler`'s plain-JSON branch rather than through the envelope.
 *
 * 401 rather than 403: the caller may retry with a credential, which is exactly what 401 means.
 */
export function clientKeyMiddleware(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	const clientKeys = Configuration.get('security.clientKeys');

	if (
		Configuration.isEnvironment('test') ||
		clientKeys.length === 0 ||
		EXEMPT_PATHS.has(req.path)
	) {
		return next();
	}

	const provided = req.get(CLIENT_KEY_HEADER);

	if (!provided || !matchesAnySecret(provided, clientKeys)) {
		/*
		 * Logged without the value: a near-miss key is still a key, and one typo away from
		 * the real one sitting in a log aggregator is worse than the failure it explains.
		 */
		getSystemLogger().warn(
			{
				method: req.method,
				path: req.path,
				hasKey: Boolean(provided),
			},
			'Rejected request with missing or unknown client key',
		);

		throw new UnauthorizedError();
	}

	next();
}

/**
 * Reports the gate's state once, at boot.
 *
 * An empty key list is a legitimate local/test configuration and a silent hole in production,
 * and the two are indistinguishable at request time — hence a single line at startup rather
 * than a per-request check.
 */
export function reportClientKeyState(): void {
	const configured = Configuration.get('security.clientKeys').length;

	if (configured > 0) {
		getSystemLogger().debug({ configured }, 'Client key gate enabled');

		return;
	}

	const message =
		'Client key gate disabled — CLIENT_API_KEYS is empty, every caller is accepted';

	if (Configuration.isEnvironment('production')) {
		getSystemLogger().warn(message);
	}
}
