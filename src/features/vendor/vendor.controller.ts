import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import VendorEntity from '@/features/vendor/vendor.entity';
import {
	type VendorPolicy,
	vendorPolicy,
} from '@/features/vendor/vendor.policy';
import {
	type VendorService,
	vendorService,
} from '@/features/vendor/vendor.service';
import { VendorValidator } from '@/features/vendor/vendor.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class VendorController extends BaseController {
	constructor(
		private policy: VendorPolicy,
		private validator: VendorValidator,
		private cache: CacheProvider,
		private vendorService: VendorService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.vendorService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('vendor.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const withDeleted = this.policy.allowDeleted(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			VendorEntity.NAME,
			data.id.toString(),
			withDeleted ? 'with-deleted' : 'non-deleted',
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, () =>
			this.vendorService.getEntryData({
				id: data.id,
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

		const existingEntry = await this.vendorService.findById(data.id, false);

		const entry = await this.vendorService.updateData(existingEntry, data);

		res.locals.output.message(lang('vendor.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.vendorService.delete(data.id);

		res.locals.output.message(lang('vendor.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.vendorService.restore(data.id);

		res.locals.output.message(lang('vendor.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.vendorService.findByFilter(
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

		const existingEntry = await this.vendorService.findById(data.id, false);

		await this.vendorService.updateStatus(existingEntry, data.status);

		res.locals.output.message(lang('vendor.success.status_update'));

		res.json(res.locals.output);
	});
}

export const vendorController = new VendorController(
	vendorPolicy,
	new VendorValidator('vendor'),
	cacheProvider,
	vendorService,
);
