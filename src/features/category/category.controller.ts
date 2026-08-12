import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import CategoryEntity from '@/features/category/category.entity';
import {
	type CategoryPolicy,
	categoryPolicy,
} from '@/features/category/category.policy';
import {
	type CategoryService,
	categoryService,
} from '@/features/category/category.service';
import { CategoryValidator } from '@/features/category/category.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

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

		const data = this.validate(
			this.validator.read,
			{
				...req.query,
				id: req.params.id,
			},
			res,
		);

		const cacheKey = this.cache.buildKey(
			CategoryEntity.NAME,
			data.id.toString(),
			data.with_ancestors ? 'with_ancestors' : 'no_ancestors',
			data.with_children ? 'with_children' : 'no_children',
			data.language ?? '',
			'read',
		);

		const cacheGetResults = await this.cache.get(
			cacheKey,
			async () =>
				await this.categoryService.getEntryData({
					id: data.id,
					language: data.language,
					with_ancestors: data.with_ancestors,
					with_children: data.with_children,
					withDeleted: this.policy.allowDeleted(res.locals.auth),
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

		// With the parent relation: `updateDataWithContent` decides on it, and an unloaded
		// relation is indistinguishable from a root.
		const existingEntry = await this.categoryService.findByIdWithParent(
			data.id,
			false,
		);

		const entry = await this.categoryService.updateDataWithContent(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('category.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.categoryService.delete(data.id);

		res.locals.output.message(lang('category.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.categoryService.restore(data.id);

		res.locals.output.message(lang('category.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

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

		// `id` and `status` come from the path (`/:id/status/:status`), `force` from the
		// query string — so both sources are merged, with the path winning on conflict.
		const data = this.validate(
			this.validator.statusUpdate,
			{ ...req.query, ...req.params },
			res,
		);

		const existingEntry = await this.categoryService.findById(
			data.id,
			false,
		);

		await this.categoryService.updateStatus(
			existingEntry,
			data.status,
			data.force,
		);

		res.locals.output.message(lang('category.success.status_update'));

		res.json(res.locals.output);
	});

	public orderUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		// `type` comes from the path (`/:type/order`); `parent_id` and `positions` from the
		// body, since the group being reordered may be the roots (no parent).
		const data = this.validate(
			this.validator.orderUpdate,
			{
				...req.body,
				type: req.params.type,
			},
			res,
		);

		await this.categoryService.updateOrder(
			data.type,
			data.parent_id,
			data.positions,
		);

		res.locals.output.message(lang('category.success.order_update'));

		res.json(res.locals.output);
	});
}

export const categoryController = new CategoryController(
	categoryPolicy,
	new CategoryValidator('category'),
	cacheProvider,
	categoryService,
);
