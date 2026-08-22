import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import ArticleEntity from '@/features/article/article.entity';
import {
	type ArticlePolicy,
	articlePolicy,
} from '@/features/article/article.policy';
import {
	type ArticleService,
	articleService,
} from '@/features/article/article.service';
import { ArticleValidator } from '@/features/article/article.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class ArticleController extends BaseController {
	constructor(
		private policy: ArticlePolicy,
		private validator: ArticleValidator,
		private cache: CacheProvider,
		private articleService: ArticleService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		/*
		 * `0` is the visitor sentinel the auth middleware seeds, not a user row, so it becomes
		 * `null` rather than an id no `user` record answers to. `author_id` is nullable by
		 * design — an article outlives the account that filed it — so an unattributable create
		 * is a valid row, not an error.
		 */
		const entry = await this.articleService.create(
			data,
			res.locals.auth?.id || null,
		);

		res.locals.output.data(entry);
		res.locals.output.message(lang('article.success.create'));

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

		/*
		 * An omitted `language` means every translation, not the request's own — the dashboard
		 * edits all of them at once and has no other way to ask. Falling back to
		 * `res.locals.language` here is what made `getEntryData`'s no-language branch
		 * unreachable, and left an editor unable to see a translation they had written.
		 */
		const language = data.language;
		const withDeleted = this.policy.allowDeleted(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			ArticleEntity.NAME,
			data.id.toString(),
			language ?? 'all-languages',
			withDeleted ? 'with-deleted' : 'non-deleted',
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, () =>
			this.articleService.getEntryData({
				id: data.id,
				language,
				withDeleted,
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

		const existingEntry = await this.articleService.findById(
			data.id,
			false,
		);

		const entry = await this.articleService.updateDataWithContent(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('article.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.articleService.delete(data.id);

		res.locals.output.message(lang('article.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.articleService.restore(data.id);

		res.locals.output.message(lang('article.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		if (!data.filter.language) {
			data.filter.language = res.locals.language;
		}

		const [entries, total] = await this.articleService.findByFilter(
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

	public orderUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.orderUpdate,
			{
				...req.body,
				featured_status: req.params.featured_status,
			},
			res,
		);

		await this.articleService.updateOrder(data);

		res.locals.output.message(lang('article.success.order_update'));

		res.json(res.locals.output);
	});

	public statusUpdate = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(
			this.validator.statusUpdate,
			req.params,
			res,
		);

		const existingEntry = await this.articleService.findById(
			data.id,
			false,
		);

		await this.articleService.updateStatus(existingEntry, data.status);

		res.locals.output.message(lang('article.success.status_update'));

		res.json(res.locals.output);
	});
}

export const articleController = new ArticleController(
	articlePolicy,
	new ArticleValidator('article'),
	cacheProvider,
	articleService,
);
