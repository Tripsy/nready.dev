import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BrandEntity from '@/features/brand/brand.entity';
import { type BrandPolicy, brandPolicy } from '@/features/brand/brand.policy';
import {
	type BrandService,
	brandService,
} from '@/features/brand/brand.service';
import {
	type BrandValidator,
	brandValidator,
} from '@/features/brand/brand.validator';
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

		const data = this.validate(this.validator.read, req.query, res);

		const cacheKey = this.cache.buildKey(
			BrandEntity.NAME,
			res.locals.validated.id,
			data.language ?? '',
			'read',
		);

		const cacheGetResults = await this.cache.get(
			cacheKey,
			async () =>
				await this.brandService.getDataById(
					res.locals.validated.id,
					data,
					this.policy.allowDeleted(res.locals.auth),
				),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(this.validator.update, req.body, res);

		const entry = await this.brandService.updateDataWithContent(
			res.locals.validated.id,
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('brand.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.brandService.delete(res.locals.validated.id);

		res.locals.output.message(lang('brand.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.brandService.restore(res.locals.validated.id);

		res.locals.output.message(lang('brand.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(
			this.validator.find,
			{
				...req.query,
				...(res.locals.filter !== undefined && {
					filter: res.locals.filter,
				}),
			},
			res,
		);

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

	public statusUpdate = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		await this.brandService.updateStatus(
			res.locals.validated.id,
			res.locals.validated.status,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('brand.success.status_update'));

		res.json(res.locals.output);
	});

	public orderUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(this.validator.orderUpdate, req.body, res);

		await this.brandService.updateOrder(
			res.locals.validated.brand_type,
			data.positions,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('brand.success.order_update'));

		res.json(res.locals.output);
	});
}

export const brandController = new BrandController(
	brandPolicy,
	brandValidator,
	cacheProvider,
	brandService,
);
