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
	 * A route module's documentation describes endpoints belonging to a feature's entity, so it
	 * is gated by the same `read` permission as the entity itself rather than by one of its own.
	 *
	 * The entity comes from the registry rather than from the requested name: a secondary module
	 * is named for itself, so `article-public` documents the `article` entity and gating on its
	 * own name would check a permission nobody can hold. An unknown feature has no entity to
	 * look up and falls back to the requested name, which keeps it behind the same check.
	 */
	public read = asyncHandler(async (req: Request, res: Response) => {
		const { feature } = this.validate(this.validator.read, req.params, res);

		const documentation = getFeatureDocumentation(feature);

		/*
		 * Authorize before answering, so an undocumented feature and an unauthorized one are
		 * indistinguishable to a caller who may not read that entity. The 404 below is only
		 * reachable once the caller is allowed to read it in the first place.
		 */
		new PolicyAbstract(documentation?.entity ?? feature).canRead(
			res.locals.auth,
		);

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
			actions: documentation.actions,
		});

		res.json(res.locals.output);
	});
}

export const docsController = new DocsController(new DocsValidator('docs'));
