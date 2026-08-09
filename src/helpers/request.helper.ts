import type { Request } from 'express';

/**
 * Read a single route parameter as a string.
 *
 * @param {Request} req - The request to read the parameter from
 * @param {string} name - The route parameter name
 * @returns {string | undefined} - The parameter value, or undefined if it is not a single string
 */
export function getRouteParam(req: Request, name: string): string | undefined {
	const value = req.params[name];

	return typeof value === 'string' ? value : undefined;
}

/**
 * Country of the requester as an ISO 3166-1 alpha-2 code, read from whichever edge header the
 * deployment sets. There is no geo-IP lookup in this project: the code always comes from a
 * proxy the API sits behind, so a deployment with no such proxy simply has no country.
 *
 * A caller that gates access on this must treat `undefined` as "unknown", not as "allowed" —
 * the header is absent both when nobody set it and when a client strips it.
 *
 * @param {Request} req - The request to read the country from
 * @returns {string | undefined} - Upper-cased two-letter code, or undefined when unknown
 */
export function getRequestCountry(req: Request): string | undefined {
	const candidates = [
		'cf-ipcountry', // Cloudflare
		'x-vercel-ip-country', // Vercel
		'x-appengine-country', // Google App Engine
		'x-country-code',
	];

	for (const header of candidates) {
		const value = req.get(header);

		if (value?.length !== 2) {
			continue;
		}

		// Cloudflare answers `XX` for an address it cannot place
		if (value === 'XX') {
			continue;
		}

		return value.toUpperCase();
	}

	return undefined;
}
