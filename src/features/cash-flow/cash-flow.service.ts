import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { BadRequestError, CustomError } from '@/exceptions';
import CashFlowEntity, {
	CashFlowCategoryEnum,
	CashFlowCategoryTypeEnum,
	type CashFlowDirectionEnum,
	CashFlowStatusEnum,
	CURRENCY_DEFAULT,
	type CurrencyEnum,
	getExpectedCategoryType,
	getExpectedDirection,
	MUTABLE_STATUSES,
	REFUNDABLE_STATUSES,
	STATUS_TRANSITIONS,
} from '@/features/cash-flow/cash-flow.entity';
import { getCashFlowRepository } from '@/features/cash-flow/cash-flow.repository';
import {
	type CashFlowValidator,
	paramsUpdateList,
} from '@/features/cash-flow/cash-flow.validator';
import type { ValidatorOutput } from '@/helpers/mock.helper';
import { assertValidStatusTransition } from '@/shared/abstracts/service.abstract';

export class CashFlowService {
	constructor(private repository: ReturnType<typeof getCashFlowRepository>) {}

	public checkDirection(
		category_type: CashFlowCategoryTypeEnum,
		direction: CashFlowDirectionEnum,
	) {
		const expectedDirection = getExpectedDirection(category_type);

		if (expectedDirection && direction !== expectedDirection) {
			throw new BadRequestError(
				lang('cash-flow.error.direction_expected_from_category_type', {
					category_type: category_type,
					direction: expectedDirection,
				}),
			);
		}
	}

	public checkCategoryType(
		category_type: CashFlowCategoryTypeEnum,
		category: CashFlowCategoryEnum,
	) {
		const expectedCategoryType = getExpectedCategoryType(category);

		if (category_type !== expectedCategoryType) {
			throw new BadRequestError(
				lang('cash-flow.error.category_type_mismatch', {
					category: category_type,
					category_type: expectedCategoryType,
				}),
			);
		}
	}

	public checkCategory(category: CashFlowCategoryEnum, parent_id?: number) {
		if (category === CashFlowCategoryEnum.REFUND && !parent_id) {
			throw new BadRequestError(
				lang('cash-flow.error.refund_parent_required'),
			);
		}
	}

	public checkAmount(amount: number) {
		if (amount <= 0) {
			throw new BadRequestError(
				lang('cash-flow.validation.invalid_amount'),
			);
		}
	}

	public async checkRefund(deps: {
		category: CashFlowCategoryEnum;
		amount: number;
		currency: CurrencyEnum;
		parentEntry: CashFlowEntity;
		refundedAmount: number;
	}) {
		if (deps.category !== CashFlowCategoryEnum.REFUND) {
			throw new BadRequestError(
				lang('cash-flow.validation.invalid_category'),
			);
		}

		if (!REFUNDABLE_STATUSES.includes(deps.parentEntry.status)) {
			throw new CustomError(
				409,
				lang('cash-flow.error.refund_parent_status_invalid', {
					status: deps.parentEntry.status,
				}),
			);
		}

		if (deps.parentEntry.currency !== deps.currency) {
			throw new CustomError(
				409,
				lang('cash-flow.error.refund_parent_same_currency'),
			);
		}

		if (
			deps.parentEntry.category_type ===
			CashFlowCategoryTypeEnum.CORRECTION
		) {
			throw new CustomError(
				409,
				lang('cash-flow.error.refund_parent_invalid_category_type'),
			);
		}

		if (
			[CashFlowCategoryEnum.EMPLOYEE_SALARY].includes(
				deps.parentEntry.category,
			)
		) {
			throw new CustomError(
				409,
				lang('cash-flow.error.refund_parent_invalid_category'),
			);
		}

		if (deps.parentEntry.amount < deps.amount) {
			throw new CustomError(
				409,
				lang('cash-flow.error.refund_amount_mismatch', {
					max_amount: (deps.parentEntry.amount / 100)
						.toFixed(2)
						.toString(),
				}),
			);
		}

		if (deps.parentEntry.amount - deps.refundedAmount < deps.amount) {
			throw new CustomError(
				409,
				lang('cash-flow.error.refund_amount_mismatch', {
					max_amount: (
						(deps.parentEntry.amount - deps.refundedAmount) /
						100
					)
						.toFixed(2)
						.toString(),
				}),
			);
		}
	}

	public getExchangeRate(selectedCurrency: CurrencyEnum) {
		if (selectedCurrency === CURRENCY_DEFAULT) {
			return 1;
		}

		// TODO - not implemented
		return 1.1;
	}

	public async getRefundedAmountSum(parent_id: number): Promise<number> {
		const result = await this.repository
			.createQuery()
			.select(['SUM(cash_flow.amount) AS total'], false)
			.filterBy('parent_id', parent_id)
			.firstRaw();

		return result.total || 0;
	}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<CashFlowValidator, 'create'>,
	): Promise<CashFlowEntity> {
		this.checkDirection(data.category_type, data.direction);
		this.checkCategoryType(data.category_type, data.category);
		this.checkCategory(data.category, data.parent_id);
		this.checkAmount(data.amount);

		if (data.parent_id) {
			const parentEntry = await this.findById(data.parent_id, false);

			const refundedAmount = await this.getRefundedAmountSum(
				data.parent_id,
			);

			await this.checkRefund({
				category: data.category,
				amount: data.amount,
				currency: data.currency,
				parentEntry: parentEntry,
				refundedAmount: refundedAmount,
			});
		}

		const entry = {
			direction: data.direction,
			category_type: data.category_type,
			category: data.category,
			gateway: data.gateway,
			method: data.method,
			amount: data.amount,
			vat_rate: data.vat_rate,
			currency: data.currency,
			exchange_rate: this.getExchangeRate(data.currency),
			external_reference: data.external_reference,
			parent_id: data.parent_id,
			notes: data.notes,
			status: CashFlowStatusEnum.COMPLETED, // force `status` as COMPLETED when create runs via controller
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<CashFlowEntity> & { id: number },
	): Promise<CashFlowEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		data: ValidatorOutput<CashFlowValidator, 'update'>,
		withDeleted: boolean = true,
	) {
		const entry = await this.findById(id, withDeleted);

		if (!MUTABLE_STATUSES.includes(entry.status)) {
			throw new CustomError(
				409,
				lang('cash-flow.error.update_not_allowed'),
			);
		}

		if (data.category_type || entry.direction) {
			this.checkDirection(
				data.category_type || entry.category_type,
				data.direction || entry.direction,
			);
		}

		if (data.category_type || data.direction) {
			this.checkCategoryType(
				data.category_type || entry.category_type,
				data.category || entry.category,
			);
		}

		if (data.category) {
			this.checkCategory(
				data.category || entry.category,
				entry.parent_id || undefined,
			);
		}

		if (data.amount) {
			this.checkAmount(data.amount);
		}

		if (
			entry.parent_id &&
			(data.category || data.amount || data.currency)
		) {
			const parentEntry = await this.findById(entry.parent_id, false);

			const refundedAmount = await this.getRefundedAmountSum(
				entry.parent_id,
			);

			await this.checkRefund({
				category: data.category || entry.category,
				amount: data.amount || entry.amount,
				currency: data.currency || entry.currency,
				parentEntry: parentEntry,
				refundedAmount: refundedAmount,
			});
		}

		const updateData = {
			...Object.fromEntries(
				paramsUpdateList
					.filter((key) => key in data)
					.map((key) => [key, data[key as keyof typeof data]]),
			),
			id,
		};

		return this.update(updateData);
	}

	public async updateStatus(
		id: number,
		newStatus: CashFlowStatusEnum,
		withDeleted: boolean,
	): Promise<void> {
		const entry = await this.findById(id, withDeleted);

		assertValidStatusTransition(
			STATUS_TRANSITIONS,
			entry.status,
			newStatus,
		);

		entry.status = newStatus;

		await this.repository.save(entry);
	}

	public async delete(id: number, force: boolean) {
		const entry = await this.repository
			.createQuery()
			.joinAndSelect('cash_flow.refunds', 'refunds', 'LEFT')
			.filterById(id)
			.withDeleted(false)
			.first();

		if (!entry) {
			return;
		}

		if (entry.refunds?.length) {
			if (force) {
				await this.repository
					.createQuery()
					.filterBy('parent_id', id)
					.delete(true, true, true);
			} else {
				throw new CustomError(
					409,
					lang('cash-flow.error.cannot_delete_with_refunds'),
				);
			}
		}

		await this.repository.createQuery().filterById(id).delete();
	}

	public findById(id: number, withDeleted: boolean): Promise<CashFlowEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByFilter(
		data: ValidatorOutput<CashFlowValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.filterById(data.filter.id)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const cashFlowService = new CashFlowService(getCashFlowRepository());
