import type { NextFunction, Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import { BadRequestError } from '@/exceptions';

export const validateParamsWhenId = (...args: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const errors: Record<string, unknown>[] = [];

		for (const name of args) {
			const value = parseInt(req.params[name], 10);

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
