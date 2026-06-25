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

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.templateService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('template.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const cacheKey = this.cache.buildKey(
			TemplateEntity.NAME,
			data.id.toString(),
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.templateService.findById(
				data.id,
				this.policy.allowDeleted(res.locals.auth),
			),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public readPage = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(this.validator.readPage, req.params, res);

		const cacheKey = this.cache.buildKey(
			TemplateEntity.NAME,
			data.label,
			res.locals.language,
			TemplateTypeEnum.PAGE,
			'read',
		);

		const entry = await this.cache.get(cacheKey, async () =>
			this.templateService.findByLabel(
				data.label,
				res.locals.language,
				TemplateTypeEnum.PAGE,
			),
		);

		res.locals.output.meta(res.locals.outputder.isCached, 'isCached');
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.update,
			{
				...req.body,
				id: req.params.id,
			},
			res,
		);

		const existingEntry = await this.templateService.findById(
			data.id,
			false,
		);

		const entry = await this.templateService.updateData(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('template.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.templateService.delete(data.id);

		res.locals.output.message(lang('template.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.templateService.restore(data.id);

		res.locals.output.message(lang('template.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

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
}

export const templateController = new TemplateController(
	templatePolicy,
	templateValidator,
	cacheProvider,
	templateService,
);
