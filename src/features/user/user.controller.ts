import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import UserEntity from '@/features/user/user.entity';
import { type UserPolicy, userPolicy } from '@/features/user/user.policy';
import { type UserService, userService } from '@/features/user/user.service';
import {
	type UserValidator,
	userValidator,
} from '@/features/user/user.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class UserController extends BaseController {
	constructor(
		private policy: UserPolicy,
		private validator: UserValidator,
		private cache: CacheProvider,
		private userService: UserService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.userService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('user.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.params, res);

		const cacheKey = this.cache.buildKey(
			UserEntity.NAME,
			data.id.toString(),
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.userService.findById(
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

		const existingEntry = await this.userService.findById(data.id, false);

		const entry = await this.userService.updateData(existingEntry, data);

		res.locals.output.message(lang('user.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.userService.delete(data.id);

		res.locals.output.message(lang('user.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.userService.restore(data.id);

		res.locals.output.message(lang('user.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		const [entries, total] = await this.userService.findByFilter(
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

		const existingEntry = await this.userService.findById(data.id, false);

		await this.userService.updateStatus(existingEntry, data.status);

		res.locals.output.message(lang('user.success.status_update'));

		res.json(res.locals.output);
	});
}

export const userController = new UserController(
	userPolicy,
	userValidator,
	cacheProvider,
	userService,
);
