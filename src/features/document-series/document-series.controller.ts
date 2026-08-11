import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import DocumentSeriesEntity from '@/features/document-series/document-series.entity';
import {
	type DocumentSeriesPolicy,
	documentSeriesPolicy,
} from '@/features/document-series/document-series.policy';
import {
	type DocumentSeriesService,
	documentSeriesService,
} from '@/features/document-series/document-series.service';
import { DocumentSeriesValidator } from '@/features/document-series/document-series.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class DocumentSeriesController extends BaseController {
	constructor(
		private policy: DocumentSeriesPolicy,
		private validator: DocumentSeriesValidator,
		private cache: CacheProvider,
		private documentSeriesService: DocumentSeriesService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.documentSeriesService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('document-series.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const cacheKey = this.cache.buildKey(
			DocumentSeriesEntity.NAME,
			data.id.toString(),
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, () =>
			this.documentSeriesService.getEntryData({ id: data.id }),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

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

		const existingEntry = await this.documentSeriesService.findById(
			data.id,
		);

		const entry = await this.documentSeriesService.updateData(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('document-series.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.documentSeriesService.delete(data.id);

		res.locals.output.message(lang('document-series.success.delete'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] =
			await this.documentSeriesService.findByFilter(data);

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

export const documentSeriesController = new DocumentSeriesController(
	documentSeriesPolicy,
	new DocumentSeriesValidator('document-series'),
	cacheProvider,
	documentSeriesService,
);
