import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import AddressEntity from '@/features/address/address.entity';
import {
	type AddressPolicy,
	addressPolicy,
} from '@/features/address/address.policy';
import {
	type AddressService,
	addressService,
} from '@/features/address/address.service';
import {
	type AddressValidator,
	addressValidator,
} from '@/features/address/address.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class AddressController extends BaseController {
	constructor(
		private policy: AddressPolicy,
		private validator: AddressValidator,
		private cache: CacheProvider,
		private addressService: AddressService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.addressService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('address.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.query, res);

		const cacheKey = this.cache.buildKey(
			AddressEntity.NAME,
			res.locals.validated.id,
			data.language ?? '',
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.addressService.getDataById(
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

		const entry = await this.addressService.updateData(
			res.locals.validated.id,
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('address.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.addressService.delete(res.locals.validated.id);

		res.locals.output.message(lang('address.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.addressService.restore(res.locals.validated.id);

		res.locals.output.message(lang('address.success.restore'));

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

		const [entries, total] = await this.addressService.findByFilter(
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

export const addressController = new AddressController(
	addressPolicy,
	addressValidator,
	cacheProvider,
	addressService,
);
