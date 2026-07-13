import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import ImageEntity from '@/features/image/image.entity';
import { type ImagePolicy, imagePolicy } from '@/features/image/image.policy';
import {
	type ImageService,
	imageService,
} from '@/features/image/image.service';
import { ImageValidator } from '@/features/image/image.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class ImageController extends BaseController {
	constructor(
		private policy: ImagePolicy,
		private validator: ImageValidator,
		private cache: CacheProvider,
		private imageService: ImageService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(
			this.validator.create,
			{
				...req.body,
				section: req.params.section,
				entity_id: req.params.entity_id,
			},
			res,
		);

		const entry = await this.imageService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('image.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(
			this.validator.read,
			{
				...req.query,
				id: req.params.id,
			},
			res,
		);

		const cacheKey = this.cache.buildKey(
			ImageEntity.NAME,
			data.id.toString(),
			data.language ?? '',
			'read',
		);

		const cacheGetResults = await this.cache.get(
			cacheKey,
			async () =>
				await this.imageService.getEntryData({
					id: data.id,
					language: data.language,
				}),
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

		const existingEntry = await this.imageService.findById(data.id);

		const entry = await this.imageService.updateDataWithContent(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('image.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.imageService.delete(data.id);

		res.locals.output.message(lang('image.success.delete'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.imageService.findByFilter(data);

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

	public statusUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.statusUpdate,
			req.params,
			res,
		);

		const existingEntry = await this.imageService.findById(data.id);

		await this.imageService.updateStatus(existingEntry, data.status);

		res.locals.output.message(lang('image.success.status_update'));

		res.json(res.locals.output);
	});

	public orderUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.orderUpdate,
			{
				...req.body,
				section: req.params.section,
				entity_id: req.params.entity_id,
			},
			res,
		);

		await this.imageService.updateOrder(
			data.section,
			data.entity_id,
			data.positions,
		);

		res.locals.output.message(lang('image.success.order_update'));

		res.json(res.locals.output);
	});
}

export const imageController = new ImageController(
	imagePolicy,
	new ImageValidator('image'),
	cacheProvider,
	imageService,
);
