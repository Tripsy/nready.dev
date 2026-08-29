import fs from 'node:fs';
import path from 'node:path';
import { type RequestHandler, Router } from 'express';
import { apiRateLimiter } from '@/config/rate-limit.config';
import { Configuration } from '@/config/settings.config';
import { setupFeatureDocumentation } from '@/helpers/api-documentation.helper';
import { buildSrcPath, getErrorMessage } from '@/helpers/system.helper';
import { getSystemLogger } from '@/providers/logger.provider';
import type {
	FeatureRoutesModule,
	RoutesType,
} from '@/shared/types/routes.type';

interface RouteInfo {
	name: string;
	method: string;
	path: string;
	action: string;
	description?: string;
}

function getRoutesFilePath(feature: string) {
	return buildSrcPath(
		Configuration.get('folder.features'),
		feature,
		`${feature}.routes`,
	);
}

function buildRoutes<C>({
	basePath,
	controller,
	routes,
}: {
	basePath: string;
	controller: C;
	routes: RoutesType<C>;
}): Router {
	const router = Router();

	for (const action in routes) {
		const config = routes[action];
		const { path: routePath, method, handlers = [] } = config;

		const middleware = [...handlers];

		const hasRateLimiter = middleware.some((f) =>
			(f.name || '').endsWith('RateLimiter'),
		);

		if (!hasRateLimiter) {
			middleware.push(apiRateLimiter);
		}

		const fullPath = `${basePath}${routePath}`;

		router[method](
			fullPath,
			...middleware,
			controller[action] as RequestHandler,
		);
	}

	return router;
}

const allRoutesInfo: RouteInfo[] = [];

export function getRoutesInfo(): RouteInfo[] {
	return [...allRoutesInfo];
}

function pushRouteInfo<C>(feature: string, def: FeatureRoutesModule<C>) {
	for (const action in def.routes) {
		const config = def.routes[action];
		const fullPath = `${def.basePath}${config.path}`;

		allRoutesInfo.push({
			name: `${feature}.${action}`,
			method: config.method,
			path: fullPath,
			action: action,
		});
	}
}

function findRouteFiles(featuresDirectory: string) {
	const routeFiles: string[] = [];

	function scanDirectory(directory: string) {
		const files = fs.readdirSync(directory);

		files.forEach((file) => {
			const fullPath = path.join(directory, file);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				scanDirectory(fullPath);
			} else if (
				stat.isFile() &&
				file.endsWith(`.routes.${Configuration.resolveExtension()}`)
			) {
				routeFiles.push(fullPath);
			}
		});
	}

	scanDirectory(featuresDirectory);

	return routeFiles;
}

export const initRoutes = async (): Promise<Router> => {
	const router = Router();

	const featuresPath = buildSrcPath(Configuration.get('folder.features'));
	const routeFiles = findRouteFiles(featuresPath);

	for (const routeFilePath of routeFiles) {
		await loadRoutes(router, routeFilePath);
	}

	getSystemLogger().debug('Routes initialized');

	return router;
};

async function loadRoutes(
	router: Router,
	routeFilePath: string,
): Promise<void> {
	const feature = path.basename(routeFilePath).split('.')[0];

	try {
		if (!fs.existsSync(routeFilePath)) {
			return;
		}

		const module = await import(routeFilePath);
		const defOrFactory = module.default;

		if (!defOrFactory) {
			getSystemLogger().warn(
				`Feature ${feature} does not export default routes config`,
			);
			return;
		}

		let def =
			typeof defOrFactory === 'function'
				? await defOrFactory()
				: defOrFactory;

		def = await setupFeatureDocumentation(def, routeFilePath);

		router.use(buildRoutes(def));

		if (Configuration.isEnvironment('development')) {
			pushRouteInfo(feature, def);
		}
	} catch (error) {
		getSystemLogger().error(
			{
				err: error,
				msg: getErrorMessage(error),
				feature,
				path: getRoutesFilePath(feature),
			},
			`Failed to load routes for feature "${feature}"`,
		);
	}
}
