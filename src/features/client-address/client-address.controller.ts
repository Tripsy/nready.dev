import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import ClientAddressEntity from '@/features/client-address/client-address.entity';
import {
	type ClientAddressPolicy,
	clientAddressPolicy,
} from '@/features/client-address/client-address.policy';
import {
	type ClientAddressService,
	clientAddressService,
} from '@/features/client-address/client-address.service';
import {
	type ClientAddressValidator,
	clientAddressValidator,
} from '@/features/client-address/client-address.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';
import {userPolicy} from "@/features/user/user.policy";
import {userValidator} from "@/features/user/user.validator";
import {userService} from "@/features/user/user.service";

class ClientAddressController extends BaseController {
	constructor(
		private policy: ClientAddressPolicy,
		private validator: ClientAddressValidator,
		private cache: CacheProvider,
		private clientAddressService: ClientAddressService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.clientAddressService.create(
			data,
			res.locals.validated.client_id,
		);

		res.locals.output.data(entry);
		res.locals.output.message(lang('client-address.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.query, res);

		const cacheKey = this.cache.buildKey(
			ClientAddressEntity.NAME,
			res.locals.validated.id,
			data.language ?? '',
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.clientAddressService.getDataById(
				res.locals.validated.id,
				data,
				this.policy.allowDeleted(res.locals.auth),
				res.locals.validated.client_id,
			),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(this.validator.update, req.body, res);

		const entry = await this.clientAddressService.updateData(
			res.locals.validated.id,
			data,
			this.policy.allowDeleted(res.locals.auth),
			res.locals.validated.client_id,
		);

		res.locals.output.message(lang('client-address.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.clientAddressService.delete(
			res.locals.validated.id,
			res.locals.validated.client_id,
		);

		res.locals.output.message(lang('client-address.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.clientAddressService.restore(
			res.locals.validated.id,
			res.locals.validated.client_id,
		);

		res.locals.output.message(lang('client-address.success.restore'));

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

		const [entries, total] = await this.clientAddressService.findByFilter(
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

export const clientAddressController = new ClientAddressController(
	clientAddressPolicy,
	clientAddressValidator,
	cacheProvider,
	clientAddressService,
);
