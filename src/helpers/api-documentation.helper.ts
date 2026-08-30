import path from 'node:path';
import type { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import type { HttpStatusCode } from '@/exceptions';
import { isModuleNotFound } from '@/helpers/system.helper';
import { apiDocumentationMiddleware } from '@/middleware/api-documentation.middleware';
import { getSystemLogger } from '@/providers/logger.provider';
// The import attribute is required by Node ESM, which refuses to load a JSON module
// without it. `moduleResolution: "bundler"` lets tsc and tsx accept the bare form, so this
// only failed once the built output ran under Node.
import sharedMessages from '@/shared/locales/en.json' with { type: 'json' };
import type {
	FeatureRoutesModule,
	HttpMethod,
} from '@/shared/types/routes.type';

type ZodIssue = z.core.$ZodIssue;

type ContentProperties = {
	success: {
		type: 'boolean';
		value: boolean;
	};
	message?: {
		type: 'string';
		value?: string;
	};
	errors?: {
		type: 'array';
		format: Array<ZodIssue>;
	};
	data?: {
		type: 'object' | 'array' | 'string' | 'number';
		sample?: Record<string, unknown> | string | number;
	};
};

type EntryResponseInput = {
	status: HttpStatusCode;
	content: ContentProperties;
	description: string;
};

type RequestShapeParam = {
	type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
	required: boolean;
	format?: string;
	values?: Array<string>;
	default?: unknown;
	condition?: string;
};

type RequestDataShape = Record<
	string,
	RequestShapeParam | Record<string, RequestShapeParam>
>;

export type ApiInputDocumentation = {
	description: string;
	authorization: string;
	responses: (HttpStatusCode | EntryResponseInput)[];
	request: {
		notes?: string;
		query?: RequestDataShape;
		body?: RequestDataShape;
		params?: RequestDataShape;
		sample?: Record<string, unknown>;
	};
};

type EntryResponseOutput = {
	description: string;
	content: ContentProperties;
};

export type ApiOutputDocumentation = Omit<
	ApiInputDocumentation,
	'responses'
> & {
	method: HttpMethod;
	path: string;
	responses: Partial<Record<HttpStatusCode, EntryResponseOutput>>;
};

export class ApiDocumentation {
	private actions = {} as Record<string, ApiOutputDocumentation>;

	determineSuccess(status: HttpStatusCode) {
		return status >= 200 && status < 300;
	}

	displayErrors(): ContentProperties['errors'] {
		return {
			type: 'array',
			format: [
				{
					code: 'invalid_type',
					path: ['field'],
					message: 'Validation error',
				} as ZodIssue,
			],
		};
	}

	convertToEntryResponseInput(code: HttpStatusCode): EntryResponseInput {
		const success = this.determineSuccess(code);
		const content: ContentProperties = {
			success: {
				type: 'boolean',
				value: success,
			},
			message: {
				type: 'string',
			},
		};

		let description = '';

		switch (code) {
			case 400:
				description = sharedMessages.error.invalid_request;
				break;
			case 401:
				description = sharedMessages.error.unauthorized;
				break;
			case 403:
				description = sharedMessages.error.not_allowed;
				break;
			case 404:
				description = sharedMessages.error.not_found;
				break;
			case 409:
				description = sharedMessages.error.conflict;
				break;
			case 422:
				description = sharedMessages.error.check_errors;
				content.errors = this.displayErrors();
				break;
			case 500:
				description = sharedMessages.error.server_error;
				break;
			default:
				throw new Error(
					`convertToEntryResponseInput is not implemented for status code ${code}`,
				);
		}

		return {
			status: code,
			description: description,
			content: content,
		};
	}

	addActionDocumentation(
		action: string,
		documentation: ApiOutputDocumentation,
	) {
		this.actions[action] = documentation;
	}

	output() {
		return this.actions;
	}
}

type HelperApiInputDocumentationData = {
	description: string;
	withBearerAuth?: boolean;
	success: {
		status: HttpStatusCode;
		description: string;
		withMessage?: boolean;
		dataSample?: Record<string, unknown>;
	};
	withAuthErrors?: boolean;
	withErrors?: HttpStatusCode[];
	request: ApiInputDocumentation['request'];
};

export function helperApiInputDocumentation(
	d: HelperApiInputDocumentationData,
) {
	const authErrors: HttpStatusCode[] = [401, 403];

	const statusErrors: HttpStatusCode[] = [
		...(d.withAuthErrors ? authErrors : []),
		...(d.withErrors || []),
		500,
	];

	return {
		description: d.description,
		...(d.withBearerAuth && {
			authorization: 'Bearer token required',
		}),
		responses: [
			{
				status: d.success.status,
				description: d.success.description,
				content: {
					success: {
						type: 'boolean',
						value: true,
					},
					...(d.success.dataSample && {
						data: {
							type: 'object',
							sample: d.success.dataSample,
						},
					}),
				},
			},
			...statusErrors,
		],
		request: d.request,
	} as ApiInputDocumentation;
}

export function generateDocumentation<
	R extends Record<string, { method: HttpMethod; path: string }>,
>(
	module: { basePath: string; routes: R },
	docs: Record<string, ApiInputDocumentation>,
) {
	const docsGenerator = new ApiDocumentation();

	for (const action in docs) {
		const documentation = docs[action];
		const { description, responses, ...restDocumentation } = documentation;

		const routeKey = action as keyof typeof module.routes;
		const route = module.routes[routeKey];

		const apiOutputDocumentation = {
			description: description,
			method: route.method,
			path: `${module.basePath}${route.path}`,
			...restDocumentation,
			responses: responses.reduce(
				(acc, r) => {
					if (typeof r === 'number') {
						acc[r] = docsGenerator.convertToEntryResponseInput(r);
					} else {
						acc[r.status] = {
							description: r.description,
							content: r.content,
						};
					}

					return acc;
				},
				{} as Partial<Record<HttpStatusCode, EntryResponseOutput>>,
			),
		};

		docsGenerator.addActionDocumentation(action, apiOutputDocumentation);
	}

	return docsGenerator.output();
}

export function addApiDocumentationMiddleware<C>(
	module: FeatureRoutesModule<C>,
	docs: Record<string, ApiOutputDocumentation>,
): FeatureRoutesModule<C>['routes'] {
	const newRoutes = {} as typeof module.routes;

	for (const action in module.routes) {
		const route = module.routes[action];

		newRoutes[action] = {
			...route,
			handlers: [
				...(route.handlers || []),
				apiDocumentationMiddleware(docs[action]),
			],
		};
	}

	return newRoutes;
}

export type FeatureDocumentation = {
	/**
	 * The entity these routes belong to, taken from the folder they live in rather than the
	 * route file's own name. A feature directory can hold more than one route module — the
	 * article folder ships both `article.routes.ts` and `article-public.routes.ts` — and only
	 * the folder names a real permission entity, so this is what groups the catalogue.
	 */
	entity: string;
	/**
	 * Where the module is mounted. Carried so a catalogue can print a full endpoint without
	 * re-reading the route files, and so `/public/...` modules are recognisable as the half
	 * of the API a visitor can call.
	 */
	basePath: string;
	actions: Record<string, ApiOutputDocumentation>;
};

/** A registry entry with the key it is stored under — the route module's own name. */
export type FeatureDocumentationEntry = FeatureDocumentation & {
	feature: string;
};

/**
 * Generated documentation per route module, filled during route registration and read back by
 * the `api-docs` feature. A module with no `<module>.docs.ts` never gets an entry, which is what
 * makes an unknown or undocumented feature a 404 rather than an empty payload.
 */
const featureDocumentation = new Map<string, FeatureDocumentation>();

export function getFeatureDocumentation(
	feature: string,
): FeatureDocumentation | undefined {
	return featureDocumentation.get(feature);
}

/**
 * Every documented route module, sorted by name so the catalogue has a stable order across
 * boots — the registry is filled in whatever order `findRouteFiles` walks the directory.
 */
export function listFeatureDocumentation(): FeatureDocumentationEntry[] {
	return Array.from(featureDocumentation, ([feature, documentation]) => ({
		feature,
		...documentation,
	})).sort((a, b) => a.feature.localeCompare(b.feature));
}

/**
 * Loads the `<module>.docs.ts` sitting beside a route file and registers the generated output,
 * then — in development only — also attaches it to each route so a failing request echoes it
 * back under `meta.documentation` (`output-handler.middleware.ts` writes that on non-2xx only).
 *
 * Resolved from the route file's own directory rather than from `features/<name>/<name>.docs`:
 * a secondary module is named for itself but lives in its feature's folder, so
 * `article-public.routes.ts` would otherwise send the loader to a `features/article-public/`
 * that does not exist, and its docs would be skipped without a word.
 *
 * The registry itself is filled in every environment, because `GET /api-docs/:feature` serves
 * from it and is permission-gated rather than environment-gated. Cost is one dynamic import
 * per documented module at boot; the docs modules pull in `<feature>.mock.ts` for their
 * samples, which carry no test-only dependencies.
 *
 * A module without the file throws on import and is skipped — the common case, since most
 * features are undocumented.
 */
export async function setupFeatureDocumentation<C>(
	module: FeatureRoutesModule<C>,
	routeFilePath: string,
): Promise<FeatureRoutesModule<C>> {
	const directory = path.dirname(routeFilePath);
	const feature = path.basename(routeFilePath).split('.')[0];
	const docsPath = path.join(directory, `${feature}.docs`);

	try {
		const { docs } = await import(docsPath);

		if (!docs) {
			return module;
		}

		const docsOutput = generateDocumentation(module, docs);

		featureDocumentation.set(feature, {
			entity: path.basename(directory),
			basePath: module.basePath,
			actions: docsOutput,
		});

		if (!Configuration.isEnvironment('development')) {
			return module;
		}

		return {
			...module,
			routes: addApiDocumentationMiddleware(module, docsOutput),
		};
	} catch (error) {
		/*
		 * A missing file is the ordinary case — most features are undocumented — so only that
		 * one is silent. Anything else means a docs file exists and did not load, which is
		 * otherwise indistinguishable from having none: the feature serves its routes as
		 * usual and `GET /api-docs/:feature` simply answers 404.
		 *
		 * `generateDocumentation` is the likely thrower, and it throws for reasons worth
		 * hearing about — a documented action with no matching route, or a status code
		 * `convertToEntryResponseInput` has no case for.
		 */
		if (!isModuleNotFound(error)) {
			getSystemLogger().warn(
				{ err: error, feature, path: docsPath },
				`Failed to load API documentation for "${feature}"`,
			);
		}

		return module;
	}
}
