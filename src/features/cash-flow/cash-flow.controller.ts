import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { CustomError } from '@/exceptions';
import CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import {
	type CashFlowPolicy,
	cashFlowPolicy,
} from '@/features/cash-flow/cash-flow.policy';
import {
	type CashFlowService,
	cashFlowService,
} from '@/features/cash-flow/cash-flow.service';
import {
	type CashFlowValidator,
	cashFlowValidator,
} from '@/features/cash-flow/cash-flow.validator';
import { CashFlowCategoryEnum } from '@/features/cash-flow/cash-flow-category.enum';
import asyncHandler from '@/helpers/async.handler';
import { type CacheProvider, cacheProvider } from '@/providers/cache.provider';
import { getSystemLogger } from '@/providers/logger.provider';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class CashFlowController extends BaseController {
	constructor(
		private policy: CashFlowPolicy,
		private validator: CashFlowValidator,
		private cache: CacheProvider,
		private cashFlowService: CashFlowService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate(this.validator.create, req.body, res);

		if (data.category === CashFlowCategoryEnum.REFUND) {
			this.policy.canRefund(res.locals.auth);
		}

		try {
			const entry = await this.cashFlowService.create(data);

			res.locals.output.data(entry);
			res.locals.output.message(lang('cash-flow.success.create'));

			res.status(201).json(res.locals.output);
		} catch (error) {
			if (error instanceof QueryFailedError) {
				getSystemLogger().error(
					error,
					`QueryFailedError: ${error.message}`,
				);

				throw new CustomError(500, lang('shared.error.server_error'));
			}

			throw error;
		}
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			CashFlowEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const cacheGetResults = await this.cache.get(cacheKey, async () => {
			return await this.cashFlowService.findById(
				res.locals.validated.id,
				this.policy.allowDeleted(res.locals.auth)
			);
		});

		res.locals.output.meta(cacheGetResults.isCached, 'isCached');
		res.locals.output.data(cacheGetResults.data);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate(this.validator.update, req.body, res);

		const entry = await this.cashFlowService.updateData(
			res.locals.validated.id,
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('cash-flow.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		const data = this.validate(this.validator.delete, req.query, res);

		await this.cashFlowService.delete(res.locals.validated.id, data.force);

		res.locals.output.message(lang('cash-flow.success.delete'));

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

		const [entries, total] = await this.cashFlowService.findByFilter(
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

	public statusUpdate = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		await this.cashFlowService.updateStatus(
			res.locals.validated.id,
			res.locals.validated.status,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('cash-flow.success.status_update'));

		res.json(res.locals.output);
	});

	public operationalRecords = asyncHandler(
		async (_req: Request, res: Response) => {
			this.policy.canRead(res.locals.auth);

			const cacheKey = this.cache.buildKey(
				CashFlowEntity.NAME,
				'operational-records',
				res.locals.validated.id,
			);

			const cacheGetResults = await this.cache.get(cacheKey, async () =>
				this.cashFlowService.findOperationalRecords(
					res.locals.validated.id,
				),
			);

			res.locals.output.meta(cacheGetResults.isCached, 'isCached');
			res.locals.output.data(cacheGetResults.data);

			res.json(res.locals.output);
		},
	);
}

export const cashFlowController = new CashFlowController(
	cashFlowPolicy,
	cashFlowValidator,
	cacheProvider,
	cashFlowService,
);
