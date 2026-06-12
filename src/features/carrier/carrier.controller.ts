import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import CarrierEntity from '@/features/carrier/carrier.entity';
import {
	type CarrierPolicy,
	carrierPolicy,
} from '@/features/carrier/carrier.policy';
import {
	type CarrierService,
	carrierService,
} from '@/features/carrier/carrier.service';
import {
	type CarrierValidator,
	carrierValidator,
} from '@/features/carrier/carrier.validator';
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

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			CarrierEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.carrierService.findById(
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

		const data = this.validate(this.validator.update, req.body, res);

		const entry = await this.carrierService.updateData(
			res.locals.validated.id,
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('carrier.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.carrierService.delete(res.locals.validated.id);

		res.locals.output.message(lang('carrier.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.carrierService.restore(res.locals.validated.id);

		res.locals.output.message(lang('carrier.success.restore'));

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
	carrierValidator,
	cacheProvider,
	carrierService,
);
