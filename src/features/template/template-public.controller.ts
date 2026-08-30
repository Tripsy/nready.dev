import type { Request, Response } from 'express';
import TemplateEntity, {
	TemplateTypeEnum,
} from '@/features/template/template.entity';
import {
	type TemplateService,
	templateService,
} from '@/features/template/template.service';
import { TemplateValidator } from '@/features/template/template.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The visitor-facing half of the template feature, mounted under `/public/pages` — the page
 * bodies the public site serves at `/page/<label>`.
 *
 * No policy is consulted anywhere in here — the route is open by design, and what keeps it
 * safe is the *shape* of what it can ask for: the type is pinned to `page`, so an email
 * template is unreachable whatever the label is, and the language is the request's rather than
 * the caller's to choose. Letting either be passed in is what would break that.
 */
class TemplatePublicController extends BaseController {
	constructor(
		private validator: TemplateValidator,
		private cache: CacheProvider,
		private templateService: TemplateService,
	) {
		super();
	}

	public read = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(this.validator.publicRead, req.params, res);

		/*
		 * Label, language and type, in that order — the segments `TemplateService.lookupKey`
		 * invalidates on every write. The key is shared with the write path, not this
		 * controller's own, so the order is a contract between the two.
		 */
		const cacheKey = this.cache.buildKey(
			TemplateEntity.NAME,
			data.label,
			res.locals.language,
			TemplateTypeEnum.PAGE,
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.templateService.findByLabel(
				data.label,
				res.locals.language,
				TemplateTypeEnum.PAGE,
			),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});
}

export const templatePublicController = new TemplatePublicController(
	new TemplateValidator('template'),
	cacheProvider,
	templateService,
);
