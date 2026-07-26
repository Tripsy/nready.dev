import type { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import type { HttpStatusCode } from '@/exceptions';
import { buildSrcPath } from '@/helpers/system.helper';
import { apiDocumentationMiddleware } from '@/middleware/api-documentation.middleware';
import sharedMessages from '@/shared/locales/en.json';
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

export async function setupDevelopmentDocumentation<C>(
	module: FeatureRoutesModule<C>,
	feature: string,
): Promise<FeatureRoutesModule<C>> {
	if (!Configuration.isEnvironment('development')) {
		return module;
	}

	const docsPath = buildSrcPath(
		Configuration.get('folder.features'),
		feature,
		`${feature}.docs`,
	);

	try {
		const { docs } = await import(docsPath);

		if (!docs) {
			return module;
		}

		const docsOutput = generateDocumentation(module, docs);

		return {
			...module,
			routes: addApiDocumentationMiddleware(module, docsOutput),
		};
	} catch {
		return module;
	}
}
