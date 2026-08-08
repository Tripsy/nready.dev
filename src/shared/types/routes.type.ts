import type { RequestHandler } from 'express';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type RoutesType<C> = {
	[K in keyof C]: {
		path: string;
		method: HttpMethod;
		handlers?: RequestHandler[];
	};
};

export type FeatureRoutesModule<C> = {
	basePath: string;
	controller: C;
	routes: RoutesType<C>;
};
