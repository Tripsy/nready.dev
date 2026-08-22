import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import BrandEntity from '@/features/brand/brand.entity';
import { type BrandPolicy, brandPolicy } from '@/features/brand/brand.policy';
import {
	type BrandService,
	brandService,
} from '@/features/brand/brand.service';
import { BrandValidator } from '@/features/brand/brand.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class BrandController extends BaseController {
	constructor(
		private policy: BrandPolicy,
		private validator: BrandValidator,
		private cache: CacheProvider,
		private brandService: BrandService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.brandService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('brand.success.create'));

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

		/*
		 * An omitted `language` means every translation, not the request's own — the dashboard
		 * edits all of them at once and has no other way to ask. Falling back to
		 * `res.locals.language` here is what made `getEntryData`'s no-language branch
		 * unreachable, and left an editor unable to see a translation they had written.
		 */
		const language = data.language;
		const withDeleted = this.policy.allowDeleted(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			BrandEntity.NAME,
			data.id.toString(),
			language ?? 'all-languages',
			withDeleted ? 'with-deleted' : 'non-deleted',
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, () =>
			this.brandService.getEntryData({
				id: data.id,
				language,
				withDeleted,
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

		const existingEntry = await this.brandService.findById(data.id, false);

		const entry = await this.brandService.updateDataWithContent(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('brand.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.brandService.delete(data.id);

		res.locals.output.message(lang('brand.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.brandService.restore(data.id);

		res.locals.output.message(lang('brand.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		if (!data.filter.language) {
			data.filter.language = res.locals.language;
		}

		const [entries, total] = await this.brandService.findByFilter(
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

	public statusUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.statusUpdate,
			req.params,
			res,
		);

		const existingEntry = await this.brandService.findById(data.id, false);

		await this.brandService.updateStatus(existingEntry, data.status);

		res.locals.output.message(lang('brand.success.status_update'));

		res.json(res.locals.output);
	});

	public orderUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.orderUpdate,
			{
				...req.body,
				brand_type: req.params.brand_type,
			},
			res,
		);

		await this.brandService.updateOrder(data.brand_type, data.positions);

		res.locals.output.message(lang('brand.success.order_update'));

		res.json(res.locals.output);
	});
}

export const brandController = new BrandController(
	brandPolicy,
	new BrandValidator('brand'),
	cacheProvider,
	brandService,
);
