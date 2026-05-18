import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import PermissionEntity from '@/features/permission/permission.entity';
import {
	type PermissionPolicy,
	permissionPolicy,
} from '@/features/permission/permission.policy';
import {
	type PermissionService,
	permissionService,
} from '@/features/permission/permission.service';
import {
	type PermissionValidator,
	permissionValidator,
} from '@/features/permission/permission.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class PermissionController extends BaseController {
	constructor(
		private policy: PermissionPolicy,
		private validator: PermissionValidator,
		private cache: CacheProvider,
		private permissionService: PermissionService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.manage, req.body, res);

		const createResult = await this.permissionService.create(
			this.policy.allowDeleted(res.locals.auth),
			data,
		);

		res.locals.output.data(createResult.permission);

		if (createResult.action === 'restore') {
			res.locals.output.message(lang('permission.success.restore'));
		} else {
			res.locals.output.message(lang('permission.success.create'));
		}

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			PermissionEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.permissionService.findById(
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

		const data = this.validate(this.validator.manage, req.body, res);

		const entry = await this.permissionService.updateData(
			res.locals.validated.id,
			data,
		);

		res.locals.output.message(lang('permission.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.permissionService.delete(res.locals.validated.id);

		res.locals.output.message(lang('permission.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.permissionService.restore(res.locals.validated.id);

		res.locals.output.message(lang('permission.success.restore'));

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

		const [entries, total] = await this.permissionService.findByFilter(
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

export const permissionController = new PermissionController(
	permissionPolicy,
	permissionValidator,
	cacheProvider,
	permissionService,
);
