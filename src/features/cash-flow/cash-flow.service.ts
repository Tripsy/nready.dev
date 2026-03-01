import {DeepPartial, QueryFailedError} from 'typeorm';
import {lang} from '@/config/i18n.setup';
import {BadRequestError, CustomError, NotFoundError} from '@/exceptions';
import CashFlowEntity, {
	CashFlowCategoryEnum,
	CashFlowCategoryTypeEnum,
	CashFlowDirectionEnum,
	CashFlowStatusEnum,
	CURRENCY_DEFAULT,
	CurrencyEnum,
	getExpectedCategoryType,
	getExpectedDirection, REFUNDABLE_STATUSES
} from '@/features/cash-flow/cash-flow.entity';
import {getCashFlowRepository} from '@/features/cash-flow/cash-flow.repository';
import {type CashFlowValidator, paramsUpdateList,} from '@/features/cash-flow/cash-flow.validator';
import type {ValidatorOutput} from '@/shared/abstracts/validator.abstract';

export class CashFlowService {
	constructor(
		private repository: ReturnType<typeof getCashFlowRepository>
	) {}

	private checkDirection(
		category_type: CashFlowCategoryTypeEnum,
		direction: CashFlowDirectionEnum,
	) {
		const expectedDirection = getExpectedDirection(category_type);

		if (expectedDirection && direction !== expectedDirection) {
			throw new BadRequestError(
				lang('cash-flow.error.direction_expected_from_category_type', {
					category_type: category_type,
					direction: expectedDirection
				}),
			);
		}
	}

	private checkCategoryType(
		category_type: CashFlowCategoryTypeEnum,
		category: CashFlowCategoryEnum
	) {
		const expectedCategoryType = getExpectedCategoryType(category);

		if (category_type !== expectedCategoryType) {
			throw new BadRequestError(
				lang('cash-flow.error.category_type_mismatch', {
					category: category_type,
					category_type: expectedCategoryType
				}),
			);
		}
	}

	private checkAmount(
		amount: number
	) {
		if (amount <= 0) {
			throw new BadRequestError(
				lang('cash-flow.validation.amount_invalid'),
			);
		}
	}

	private async checkRefund(deps : {
		category: CashFlowCategoryEnum,
		parent_id: number,
		amount: number,
		currency: CurrencyEnum
	}) {
		if (deps.category !== CashFlowCategoryEnum.REFUND) {
			throw new BadRequestError(
				lang('cash-flow.validation.category_invalid'),
			);
		}

		let parent: CashFlowEntity;

		try {
			parent = await this.findById(
				deps.parent_id,
				false,
			);
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw new CustomError(409,
					lang('cash-flow.error.parent_id_invalid'),
				);
			}

			throw error;
		}

		if (!REFUNDABLE_STATUSES.includes(parent.status)) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_parent_status_invalid', {
					status: parent.status
				}),
			);
		}

		if (parent.currency !== deps.currency) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_parent_same_currency'),
			);
		}

		if (parent.category_type === CashFlowCategoryTypeEnum.CORRECTION) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_parent_category_type_invalid'),
			);
		}

		if ([CashFlowCategoryEnum.EMPLOYEE_SALARY].includes(parent.category)) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_parent_category_invalid'),
			);
		}

		if (parent.amount < deps.amount) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_amount_mismatch', {
					max_amount: (parent.amount / 100).toFixed(2).toString()
				}),
			);
		}

		const refundedAmountSum = await this.getRefundedAmountSum(deps.parent_id);

		if (refundedAmountSum >= deps.amount) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_amount_mismatch', {
					max_amount: ((parent.amount - refundedAmountSum) / 100).toFixed(2).toString()
				}),
			);
		}
	}

	private getExchangeRate(selectedCurrency: CurrencyEnum) {
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
		this.checkAmount(data.amount);

		if (data.parent_id) {
			await this.checkRefund({
				category: data.category,
				parent_id: data.parent_id,
				amount: data.amount,
				currency: data.currency
			});
		} else {
			if (data.category === CashFlowCategoryEnum.REFUND) {
				throw new BadRequestError(
					lang('cash-flow.error.refund_parent_required'),
				);
			}
		}

		use transaction and update parent entry status

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
		// category refund not allowed
		if (data.name) {
			const existingCashFlow = await this.findByName(
				data.name,
				withDeleted,
				id,
			);

			if (existingCashFlow) {
				throw new CustomError(
					409,
					lang('cash-flow.error.name_already_used'),
				);
			}
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

		if (entry.status === newStatus) {
			throw new BadRequestError(
				lang('cash-flow.error.status_unchanged', { status: newStatus }),
			);
		}

		entry.status = newStatus;

		await this.repository.save(entry);
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<CashFlowEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByName(name: string, withDeleted: boolean, excludeId?: number) {
		const q = this.repository
			.createQuery()
			.filterBy('name', name)
			.withDeleted(withDeleted);

		if (excludeId) {
			q.filterBy('id', excludeId, '!=');
		}

		return q.first();
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
