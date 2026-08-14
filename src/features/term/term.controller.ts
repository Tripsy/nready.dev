import type { Request, Response } from 'express';
import { lang } from '@/config/message.setup';
import TermEntity from '@/features/term/term.entity';
import { type TermPolicy, termPolicy } from '@/features/term/term.policy';
import { type TermService, termService } from '@/features/term/term.service';
import { TermValidator } from '@/features/term/term.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class TermController extends BaseController {
	constructor(
		private policy: TermPolicy,
		private validator: TermValidator,
		private cache: CacheProvider,
		private termService: TermService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.termService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('term.success.create'));

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

		const withDeleted = this.policy.allowDeleted(res.locals.auth);

		/*
		 * Unlike the other content-bearing features, an absent `language` returns every
		 * translation rather than falling back to `res.locals.language`. A term has no wording
		 * of its own, so the editor has to see the full set to work with it; a caller that
		 * wants one language asks for it.
		 */
		const cacheKey = this.cache.buildKey(
			TermEntity.NAME,
			data.id.toString(),
			data.language ?? 'all-languages',
			withDeleted ? 'with-deleted' : 'non-deleted',
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, () =>
			this.termService.getEntryData({
				id: data.id,
				language: data.language,
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

		const existingEntry = await this.termService.findById(data.id, false);

		const entry = await this.termService.updateDataWithContent(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('term.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.termService.delete(data.id);

		res.locals.output.message(lang('term.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.termService.restore(data.id);

		res.locals.output.message(lang('term.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		if (!data.filter.language) {
			data.filter.language = res.locals.language;
		}

		const [entries, total] = await this.termService.findByFilter(
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

export const termController = new TermController(
	termPolicy,
	new TermValidator('term'),
	cacheProvider,
	termService,
);
