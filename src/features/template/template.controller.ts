import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import TemplateEntity, {
	TemplateTypeEnum,
} from '@/features/template/template.entity';
import {
	type TemplatePolicy,
	templatePolicy,
} from '@/features/template/template.policy';
import {
	type TemplateService,
	templateService,
} from '@/features/template/template.service';
import {
	type TemplateValidator,
	templateValidator,
} from '@/features/template/template.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class TemplateController extends BaseController {
	constructor(
		private policy: TemplatePolicy,
		private validator: TemplateValidator,
		private cache: CacheProvider,
		private templateService: TemplateService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create(), req.body, res);

		const entry = await this.templateService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('template.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			TemplateEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.templateService.findById(
				res.locals.validated.id,
				this.policy.allowDeleted(res.locals.auth),
			),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(this.validator.create(), req.body, res);

		const entry = await this.templateService.updateData(
			res.locals.validated.id,
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('template.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.templateService.delete(res.locals.validated.id);

		res.locals.output.message(lang('template.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.templateService.restore(res.locals.validated.id);

		res.locals.output.message(lang('template.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(
			this.validator.find(),
			{
				...req.query,
				...(res.locals.filter !== undefined && {
					filter: res.locals.filter,
				}),
			},
			res,
		);

		const [entries, total] = await this.templateService.findByFilter(
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: data.page,
				limit: data.limit,
				total: total,
			},
			query: data,
		});

		res.json(res.locals.output);
	});

	public readPage = asyncHandler(async (_req: Request, res: Response) => {
		const cacheKey = this.cache.buildKey(
			TemplateEntity.NAME,
			res.locals.validated.label,
			res.locals.lang,
			TemplateTypeEnum.PAGE,
			'read',
		);

		const entry = await this.cache.get(cacheKey, async () =>
			this.templateService.findByLabel(
				res.locals.validated.label,
				res.locals.lang,
				TemplateTypeEnum.PAGE,
				this.policy.allowDeleted(res.locals.auth),
			),
		);

		res.locals.output.meta(res.locals.outputder.isCached, 'isCached');
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});
}

export function createTemplateController(deps: {
	policy: TemplatePolicy;
	validator: TemplateValidator;
	cache: CacheProvider;
	templateService: TemplateService;
}) {
	return new TemplateController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.templateService,
	);
}

export const templateController = createTemplateController({
	policy: templatePolicy,
	validator: templateValidator,
	cache: cacheProvider,
	templateService: templateService,
});
