import type { NextFunction, Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import { BadRequestError } from '@/exceptions';

export const validateParamsWhenId = (...args: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const errors: Record<string, unknown>[] = [];

		for (const name of args) {
			/*
			 * A plain run of digits, checked by regex because neither numeric parser is
			 * strict enough on its own: `parseInt` stops at the first non-digit and reads
			 * `5abc` as 5, while `Number` accepts `5.0`, `5e2` and `0x10`. Controllers may
			 * read the param straight off the route, so this is the only check it gets.
			 */
			const value = /^\d+$/.test(req.params[name])
				? Number(req.params[name])
				: Number.NaN;

			if (Number.isNaN(value) || value <= 0) {
				errors.push({
					[name]: lang('shared.validation.invalid_id', { name }),
				});
			}
		}

		if (errors.length > 0) {
			res.locals.output.errors(errors);

			throw new BadRequestError();
		}

		next(); // Proceed to the next middleware or route handler
	};
};

export const validateParamsWhenEnum = (data: Record<string, unknown[]>) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const errors: Record<string, unknown>[] = [];

		for (const [name, allowedValues] of Object.entries(data)) {
			const value = req.params[name];

			if (!allowedValues.includes(value)) {
				errors.push({
					[name]: lang('shared.validation.invalid_enum', {
						name: name,
						allowedValues: allowedValues.join(', '),
					}),
				});
			}
		}

		if (errors.length > 0) {
			res.locals.output.errors(errors);

			throw new BadRequestError();
		}

		next(); // Proceed to the next middleware or route handler
	};
};
