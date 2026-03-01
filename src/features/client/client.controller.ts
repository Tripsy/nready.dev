import type { Request, Response } from 'express';

import { lang } from '@/config/i18n.setup';
import ClientEntity from '@/features/client/client.entity';
import {type ClientPolicy, clientPolicy} from '@/features/client/client.policy';
import {
	type ClientService,
	clientService,
} from '@/features/client/client.service';
import {
	type ClientValidator,
	clientValidator,
} from '@/features/client/client.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class ClientController extends BaseController {
	constructor(
		private policy: ClientPolicy,
		private validator: ClientValidator,
		private cache: CacheProvider,
		private clientService: ClientService,
	) {
		super();
	}
	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = await this.validateAsync(
			this.validator.create(),
			req.body,
			res,
		);

		const entry = await this.clientService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('client.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			ClientEntity.NAME,
			res.locals.id,
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.clientService.getDataById(
				res.locals.validated.id,
				res.locals.lang,
				this.policy.allowDeleted(res.locals.auth),
			),
		);

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const client = await this.clientService.findById(
			res.locals.validated.id,
			this.policy.allowDeleted(res.locals.auth),
		);

		const data = await this.validateAsync(
			this.validator.update(),
			{
				client_type: req.body.client_type ?? client.client_type,
				...req.body, // client_type (DB value will be overwritten by the one in the body if it exists)
			},
			res,
		);

		const entry = await this.clientService.updateData(
			res.locals.validated.id,
			data,
		);

		res.locals.output.message(lang('client.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.clientService.delete(res.locals.validated.id);

		res.locals.output.message(lang('client.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.clientService.restore(res.locals.validated.id);

		res.locals.output.message(lang('client.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(
			this.validator.find(),
			{
				...req.query,
				...(res.locals.filter !== undefined && {
					filter: res.locals.filter,
				}),
			},
			res,
		);

		const [entries, total] = await this.clientService.findByFilter(
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

		await this.clientService.updateStatus(
			res.locals.validated.id,
			res.locals.validated.status,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('client.success.status_update'));

		res.json(res.locals.output);
	});
}

export function createClientController(deps: {
	policy: ClientPolicy;
	validator: ClientValidator;
	cache: CacheProvider;
	clientService: ClientService;
}) {
	return new ClientController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.clientService,
	);
}

export const clientController = createClientController({
	policy: clientPolicy,
	validator: clientValidator,
	cache: cacheProvider,
	clientService: clientService,
});
