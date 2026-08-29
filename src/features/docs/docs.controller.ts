import type { Request, Response } from 'express';
import { Configuration } from '@/config/settings.config';
import { NotFoundError } from '@/exceptions';
import { DocsValidator } from '@/features/docs/docs.validator';
import { getFeatureDocumentation } from '@/helpers/api-documentation.helper';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

class DocsController extends BaseController {
	constructor(private validator: DocsValidator) {
		super();
	}

	/**
	 * A feature's documentation describes the endpoints for that feature's entity, so it is
	 * gated by the same `read` permission as the entity itself rather than by a permission of
	 * its own — `PolicyAbstract` is built per request around the requested feature name.
	 * Feature folders and entity names share the same kebab-case spelling, which is what
	 * makes the name usable directly as the policy entity.
	 */
	public read = asyncHandler(async (req: Request, res: Response) => {
		const { feature } = this.validate(this.validator.read, req.params, res);

		/*
		 * Authorize before answering, so an undocumented feature and an unauthorized one are
		 * indistinguishable to a caller who may not read that entity. The 404 below is only
		 * reachable once the caller is allowed to read it in the first place.
		 */
		new PolicyAbstract(feature).canRead(res.locals.auth);

		const documentation = getFeatureDocumentation(feature);

		if (!documentation) {
			throw new NotFoundError();
		}

		/*
		 * `baseUrl` rides along because the documented `path` is relative and a consumer
		 * rendering a runnable example has no other way to learn where this API answers —
		 * the frontend reaches it through its own proxy and never sees `REMOTE_API_URL`.
		 */
		res.locals.output.data({
			baseUrl: Configuration.get('app.url'),
			actions: documentation,
		});

		res.json(res.locals.output);
	});
}

export const docsController = new DocsController(new DocsValidator('docs'));
