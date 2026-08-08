import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import CarrierEntity from '@/features/carrier/carrier.entity';
import {
	type CarrierPolicy,
	carrierPolicy,
} from '@/features/carrier/carrier.policy';
import {
	type CarrierService,
	carrierService,
} from '@/features/carrier/carrier.service';
import { CarrierValidator } from '@/features/carrier/carrier.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class CarrierController extends BaseController {
	constructor(
		private policy: CarrierPolicy,
		private validator: CarrierValidator,
		private cache: CacheProvider,
		private carrierService: CarrierService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.carrierService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('carrier.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const cacheKey = this.cache.buildKey(
			CarrierEntity.NAME,
			data.id.toString(),
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.carrierService.findById(
				data.id,
				this.policy.allowDeleted(res.locals.auth),
			),
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

		const existingEntry = await this.carrierService.findById(
			data.id,
			false,
		);

		const entry = await this.carrierService.updateData(existingEntry, data);

		res.locals.output.message(lang('carrier.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.carrierService.delete(data.id);

		res.locals.output.message(lang('carrier.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.carrierService.restore(data.id);

		res.locals.output.message(lang('carrier.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.carrierService.findByFilter(
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

export const carrierController = new CarrierController(
	carrierPolicy,
	new CarrierValidator('carrier'),
	cacheProvider,
	carrierService,
);
