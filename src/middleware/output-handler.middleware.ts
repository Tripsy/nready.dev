import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { Configuration } from '@/config/settings.config';

type OutputData = Record<string, unknown>;
type ZodIssue = z.core.$ZodIssue;

interface OutputWrapperInterface {
	success: boolean;
	message: string;
	errors: Array<ZodIssue | OutputData>;
	data: OutputData;
	meta: OutputData;
	request?: {
		url: string;
		headers: OutputData;
		method: string;
		query?: OutputData;
		body?: OutputData;
		params?: OutputData;
	};
}

export const outputHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	res.locals.output = new OutputWrapper(req, res);

	next();
};

export class OutputWrapper {
	private readonly result: OutputWrapperInterface;
	private res: Response;

	constructor(req: Request, res: Response) {
		this.result = {
			success: false,
			message: '',
			errors: [],
			data: {},
			meta: {},
			request: {
				url: req.originalUrl,
				method: req.method,
				headers: req.headers,
				body: req.body,
				params: req.params,
				query: req.query,
			},
		};

		this.res = res;
	}

	success(value: boolean): this {
		this.result.success = value;

		return this;
	}

	message(value: string): this {
		this.result.message = value;

		return this;
	}

	errors(value: Array<ZodIssue | Record<string, unknown>>): this {
		this.result.errors = value;

		return this;
	}

	data(value: unknown, key?: string): this {
		if (key) {
			(this.result.data as OutputData)[key] = value;
		} else {
			this.result.data = value as OutputData;
		}

		return this;
	}

	meta(value: unknown, key?: string): this {
		if (key) {
			(this.result.meta as OutputData)[key] = value;
		} else {
			this.result.meta = value as OutputData;
		}

		return this;
	}

	raw(filter: boolean = true): OutputWrapperInterface {
		// Force success to true
		if ([200, 201, 202, 204].includes(this.res.statusCode)) {
			this.success(true);
		} else {
			// Attach documentation to meta data (Note: `res.locals._documentation` is set via `meta-documentation` middleware)
			if (this.res.locals._documentation) {
				this.result.meta.documentation = this.res.locals._documentation;
			}
		}

		if (filter) {
			const filteredResult: Partial<OutputWrapperInterface> = {
				...this.result,
			};

			if (
				filteredResult.errors &&
				Array.isArray(filteredResult.errors) &&
				filteredResult.errors.length === 0
			) {
				delete filteredResult.errors;
			}

			if (
				filteredResult.data &&
				Object.keys(filteredResult.data).length === 0
			) {
				delete filteredResult.data;
			}

			if (
				filteredResult.meta &&
				Object.keys(filteredResult.meta).length === 0
			) {
				delete filteredResult.meta;
			}

			/*
			 * The echoed request is a debugging aid only. `headers` carries the
			 * `Authorization` bearer token and the cookie jar, so outside debug it is
			 * dropped wholesale rather than field-by-field — reflecting credentials back
			 * to the client (and into any log or error reporter that captures the
			 * response body) is a leak, not a convenience.
			 */
			if (!Configuration.get('app.debug')) {
				delete filteredResult.request;

				return filteredResult as OutputWrapperInterface;
			}

			if (
				filteredResult.request?.body &&
				Object.keys(filteredResult.request.body).length === 0
			) {
				delete filteredResult.request.body;
			} else {
				const sensitiveFields = [
					'password',
					'password_confirm',
					'password_new',
					'password_current',
				];

				sensitiveFields.forEach((field) => {
					if (filteredResult.request?.body?.[field]) {
						filteredResult.request.body[field] = '*****';
					}
				});
			}

			if (
				filteredResult.request?.params &&
				Object.keys(filteredResult.request.params).length === 0
			) {
				delete filteredResult.request.params;
			}

			if (
				filteredResult.request?.query &&
				Object.keys(filteredResult.request.query).length === 0
			) {
				delete filteredResult.request.query;
			}

			return filteredResult as OutputWrapperInterface;
		}

		return structuredClone(this.result);
	}

	/**
	 * When serializing an object, JavaScript looks for a toJSON() property on that specific object.
	 * If the toJSON() property is a function, then that method customizes the JSON serialization behavior.
	 * JavaScript will then serialize the returned value from the toJSON() method.
	 */
	toJSON(): OutputWrapperInterface {
		return this.raw();
	}
}
