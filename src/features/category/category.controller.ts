import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import CategoryEntity from '@/features/category/category.entity';
import {
	type CategoryPolicy,
	categoryPolicy,
} from '@/features/category/category.policy';
import {
	type CategoryService,
	categoryService,
} from '@/features/category/category.service';
import {
	type CategoryValidator,
	categoryValidator,
} from '@/features/category/category.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';
import {userPolicy} from "@/features/user/user.policy";
import {userValidator} from "@/features/user/user.validator";
import {userService} from "@/features/user/user.service";

class CategoryController extends BaseController {
	constructor(
		private policy: CategoryPolicy,
		private validator: CategoryValidator,
		private cache: CacheProvider,
		private categoryService: CategoryService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.categoryService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('category.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const data = this.validate(this.validator.read, req.query, res);

		const cacheKey = this.cache.buildKey(
			CategoryEntity.NAME,
			res.locals.validated.id,
			data.with_ancestors ? 'with_ancestors' : 'no_ancestors',
			data.with_children ? 'with_children' : 'no_children',
			data.language ?? '',
			'read',
		);

		const cacheGetResults = await this.cache.get(
			cacheKey,
			async () =>
				await this.categoryService.getDataById(
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

		const entry = await this.categoryService.updateDataWithContent(
			res.locals.validated.id,
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('category.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.categoryService.delete(res.locals.validated.id);

		res.locals.output.message(lang('category.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.categoryService.restore(res.locals.validated.id);

		res.locals.output.message(lang('category.success.restore'));

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

		const [entries, total] = await this.categoryService.findByFilter(
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

		const data = this.validate(this.validator.statusUpdate, req.query, res);

		await this.categoryService.updateStatus(
			res.locals.validated.id,
			res.locals.validated.status,
			this.policy.allowDeleted(res.locals.auth),
			data.force,
		);

		res.locals.output.message(lang('category.success.status_update'));

		res.json(res.locals.output);
	});
}

export const categoryController = new CategoryController(
	categoryPolicy,
	categoryValidator,
	cacheProvider,
	categoryService,
);
