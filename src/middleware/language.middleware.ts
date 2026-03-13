import type { NextFunction, Request, Response } from 'express';
import { Configuration } from '@/config/settings.config';

function getLanguageFromHeaders(acceptLanguage?: string): string {
	if (!acceptLanguage) {
		return '';
	}

	return acceptLanguage.split(',')[0].split('-')[0];
}

async function languageMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	let language: string = (req.query.lang as string) || '';

	if (!language) {
		language = getLanguageFromHeaders(req.headers['accept-language']);
	}

	// Attach lang value to the request object
	if (
		(Configuration.get('app.languageSupported') as string[]).includes(
			language,
		)
	) {
		res.locals.language = language;
	} else {
		res.locals.language = Configuration.get('app.language') as string;
	}

	next();
}

export default languageMiddleware;
