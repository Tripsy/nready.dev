import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import PlaceEntity from '@/features/place/place.entity';
import { type PlacePolicy, placePolicy } from '@/features/place/place.policy';
import {
	type PlaceService,
	placeService,
} from '@/features/place/place.service';
import {
	type PlaceValidator,
	placeValidator,
} from '@/features/place/place.validator';
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

		const data = this.validate(this.validator.read, req.query, res);

		const cacheKey = this.cache.buildKey(
			PlaceEntity.NAME,
			res.locals.validated.id,
			data.language ?? '',
			'read',
		);

		const cacheGetResults = await this.cache.get(
			cacheKey,
			async () =>
				await this.placeService.getDataById(
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

		const entry = await this.placeService.updateDataWithContent(
			res.locals.validated.id,
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('place.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.placeService.delete(res.locals.validated.id);

		res.locals.output.message(lang('place.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.placeService.restore(res.locals.validated.id);

		res.locals.output.message(lang('place.success.restore'));

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
	placeValidator,
	cacheProvider,
	placeService,
);
