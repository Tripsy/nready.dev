import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import DiscountEntity from '@/features/discount/discount.entity';
import {
	type DiscountPolicy,
	discountPolicy,
} from '@/features/discount/discount.policy';
import {
	type DiscountService,
	discountService,
} from '@/features/discount/discount.service';
import {
	type DiscountValidator,
	discountValidator,
} from '@/features/discount/discount.validator';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class DiscountController extends BaseController {
	constructor(
		private policy: DiscountPolicy,
		private validator: DiscountValidator,
		private cache: CacheProvider,
		private discountService: DiscountService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create(), req.body, res);

		const entry = await this.discountService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('discount.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			DiscountEntity.NAME,
			res.locals.id,
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () =>
			this.discountService.findById(
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

		const data = this.validate(this.validator.update(), req.body, res);

		const entry = await this.discountService.updateData(
			res.locals.validated.id,
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('discount.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.discountService.delete(res.locals.validated.id);

		res.locals.output.message(lang('discount.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.discountService.restore(res.locals.validated.id);

		res.locals.output.message(lang('discount.success.restore'));

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

		const [entries, total] = await this.discountService.findByFilter(
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

export function createDiscountController(deps: {
	policy: DiscountPolicy;
	validator: DiscountValidator;
	cache: CacheProvider;
	discountService: DiscountService;
}) {
	return new DiscountController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.discountService,
	);
}

export const discountController = createDiscountController({
	policy: discountPolicy,
	validator: discountValidator,
	cache: cacheProvider,
	discountService: discountService,
});
