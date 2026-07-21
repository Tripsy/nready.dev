import type { Response } from 'express';
import type { z } from 'zod';
import { BadRequestError, UnprocessableContentError } from '@/exceptions';

export abstract class BaseController {
	protected validate<V extends z.ZodTypeAny>(
		validator: V,
		sourceData: unknown,
		res: Response,
	) {
		if (!sourceData) {
			throw new BadRequestError();
		}

		// Validate against the schema
		const validated = validator.safeParse(sourceData);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new UnprocessableContentError();
		}

		return validated.data;
	}

	protected async validateAsync<V extends z.ZodTypeAny>(
		validator: V,
		sourceData: unknown,
		res: Response,
	) {
		// Validate against the schema
		const validated = await validator.safeParseAsync(sourceData);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		return validated.data;
	}
}
