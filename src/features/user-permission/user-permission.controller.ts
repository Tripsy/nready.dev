import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import {
	type PermissionPolicy,
	permissionPolicy,
} from '@/features/permission/permission.policy';
import {
	type UserPermissionService,
	userPermissionService,
} from '@/features/user-permission/user-permission.service';
import {
	type UserPermissionValidator,
	userPermissionValidator,
} from '@/features/user-permission/user-permission.validator';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class UserPermissionController extends BaseController {
	constructor(
		private policy: PermissionPolicy,
		private validator: UserPermissionValidator,
		private userPermissionService: UserPermissionService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const results = await this.userPermissionService.create(
			data,
			res.locals.validated.user_id,
		);

		res.locals.output.data(results);
		res.locals.output.message(lang('user-permission.success.update'));

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.userPermissionService.delete(
			res.locals.validated.user_id,
			res.locals.validated.permission_id,
		);

		res.locals.output.message(lang('user-permission.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.userPermissionService.restore(
			res.locals.validated.user_id,
			res.locals.validated.id,
		);

		res.locals.output.message(lang('user-permission.success.restore'));

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

		const [entries, total] = await this.userPermissionService.findByFilter(
			data,
			res.locals.validated.user_id,
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

export const userPermissionController = new UserPermissionController(
	permissionPolicy,
	userPermissionValidator,
	userPermissionService,
);
