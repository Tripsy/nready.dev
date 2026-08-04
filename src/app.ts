import 'reflect-metadata';
import 'dotenv/config';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import qs from 'qs';
import { v4 as uuid } from 'uuid';
import { Configuration } from '@/config/settings.config';
import { createCurrentDate } from '@/helpers/date.helper';
import authMiddleware from '@/middleware/auth.middleware';
import { corsHandler } from '@/middleware/cors-handler.middleware';
import { errorHandler } from '@/middleware/error-handler.middleware';
import languageMiddleware from '@/middleware/language.middleware';
import { notFoundHandler } from '@/middleware/not-found-handler.middleware';
import { outputHandler } from '@/middleware/output-handler.middleware';
import { requestContextMiddleware } from '@/middleware/request-context.middleware';
import { getSystemLogger } from '@/providers/logger.provider';

// Used for `req.setTimeout`
const REQUEST_TIMEOUT = Number(process.env.REQUEST_TIMEOUT) || 60000; // 60 seconds

export async function createApp() {
	const app = express();

	// Helmet security headers (configured for API)
	app.use(
		helmet({
			/**
			 * APIs don't render HTML.
			 */
			contentSecurityPolicy: {
				useDefaults: false,
				directives: {
					defaultSrc: ["'none'"],
				},
			},

			/**
			 * Stop browsers from sniffing MIME types.
			 * Prevents some XSS attacks.
			 */
			noSniff: true,

			/**
			 * Prevent browser from sending cross-domain requests automatically.
			 * A must for secure APIs.
			 */
			referrerPolicy: { policy: 'no-referrer' },

			/**
			 * Not relevant for APIs
			 */
			frameguard: { action: 'deny' },

			/**
			 * HSTS only in production.
			 * WARNING: Never enable in dev or localhost.
			 */
			hsts:
				process.env.NODE_ENV === 'production'
					? { maxAge: 31536000, includeSubDomains: true }
					: false,

			/**
			 * Hide "X-Powered-By: Express"
			 */
			hidePoweredBy: true,
		}),
	);

	/*
	 * Configuration
	 *
	 * In production the app sits behind exactly one reverse proxy, so `req.ip` must come
	 * from X-Forwarded-For rather than the socket — otherwise every request looks like it
	 * originates from the proxy's address. That single shared address would collapse
	 * `express-rate-limit` into one global bucket for all callers, and make every logged IP
	 * identical.
	 *
	 * The value is the hop count, not a boolean, and it must match the real topology: the
	 * proxy is expected to *replace* X-Forwarded-For so the header carries exactly one
	 * entry. Trusting more hops than exist would let a caller forge the header and evade
	 * rate limiting by spoofing an address.
	 *
	 * Left off outside production, where the app is reached directly and any
	 * X-Forwarded-For is untrusted input.
	 */
	app.set(
		'trust proxy',
		Configuration.isEnvironment('production') ? 1 : false,
	);

	// CORS handling
	app.use(corsHandler);

	// Compression
	app.use(
		compression({
			threshold: 1024,
			filter: (req: Request, res: Response): boolean => {
				// skip for small responses
				const skip = req.get('x-no-compression');

				if (skip) {
					return false;
				}

				return compression.filter(req, res);
			},
		}),
	);

	// Request parsing
	app.use(cookieParser());
	app.use(express.json({ limit: '10mb' }));
	app.use(express.urlencoded({ extended: true, limit: '10mb' }));

	// Request ID middleware
	app.use((_req, res, next) => {
		res.locals.request_id = uuid();
		res.setHeader('X-Request-ID', res.locals.request_id);

		next();
	});

	// Request timeout
	app.use((req, res, next) => {
		req.setTimeout(REQUEST_TIMEOUT, () => {
			getSystemLogger().warn(
				`Request timeout: ${req.method} ${req.url} (${res.locals.request_id})`,
			);
		});

		next();
	});

	// Middleware
	app.set('query parser', (str: string) =>
		qs.parse(str, { allowDots: true }),
	);
	app.use(outputHandler); // Set `res.locals.output`

	app.use(languageMiddleware); // Set `res.locals.language` (drives content/email language, not messages)

	if (!Configuration.isEnvironment('test')) {
		app.use(authMiddleware); // Set `res.locals.auth`
	}

	app.use(requestContextMiddleware); // Prepare `requestContext`

	// Routes
	const { initRoutes } = await import('@/config/routes.setup');
	const router = await initRoutes();
	app.use(router);

	// Route - health
	app.get('/health', (_req, res) => {
		res.status(200).json({
			status: 'OK',
			timestamp: createCurrentDate().toISOString(),
			uptime: process.uptime(),
		});
	});

	// Route - ready
	app.get('/ready', (_req, res) => {
		res.status(200).json({ ready: true });
	});

	// Error handlers (must be last)
	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}
