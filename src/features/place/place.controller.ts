import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import PlaceEntity from '@/features/place/place.entity';
import { type PlacePolicy, placePolicy } from '@/features/place/place.policy';
import {
	type PlaceService,
	placeService,
} from '@/features/place/place.service';
import { PlaceValidator } from '@/features/place/place.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class PlaceController extends BaseController {
	constructor(
		private policy: PlacePolicy,
		private validator: PlaceValidator,
		private cache: CacheProvider,
		private placeService: PlaceService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		const entry = await this.placeService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('place.success.create'));

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

		const language = data.language ?? res.locals.language;
		const withDeleted = this.policy.allowDeleted(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			PlaceEntity.NAME,
			data.id.toString(),
			language,
			withDeleted ? 'with-deleted' : 'non-deleted',
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, () =>
			this.placeService.getEntryData({
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

		const existingEntry = await this.placeService.findById(data.id, false);

		const entry = await this.placeService.updateDataWithContent(
			existingEntry,
			data,
		);

		res.locals.output.message(lang('place.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.params, res);

		await this.placeService.delete(data.id);

		res.locals.output.message(lang('place.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		const data = this.validate(this.validator.restore, req.params, res);

		await this.placeService.restore(data.id);

		res.locals.output.message(lang('place.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		if (!data.filter.language) {
			data.filter.language = res.locals.language;
		}

		const [entries, total] = await this.placeService.findByFilter(
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

export const placeController = new PlaceController(
	placePolicy,
	new PlaceValidator('place'),
	cacheProvider,
	placeService,
);
