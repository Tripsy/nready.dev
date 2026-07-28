import type { Request } from 'express';

/**
 * Read a single route parameter as a string.
 *
 * Express 5 types `req.params[name]` as `string | string[]`, because a repeating route
 * segment (`/:id+`) binds to an array. No route in this project declares one, so an array
 * here means the request did not match the route it was dispatched to. Returning
 * `undefined` in that case hands the value to the caller's existing invalid-input path
 * instead of silently reading the first element.
 *
 * @param {Request} req - The request to read the parameter from
 * @param {string} name - The route parameter name
 * @returns {string | undefined} - The parameter value, or undefined if it is not a single string
 */
export function getRouteParam(req: Request, name: string): string | undefined {
	const value = req.params[name];

	return typeof value === 'string' ? value : undefined;
}
