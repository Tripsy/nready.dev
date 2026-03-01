import {DeepPartial, QueryFailedError} from 'typeorm';
import {lang} from '@/config/i18n.setup';
import {BadRequestError, CustomError, NotFoundError} from '@/exceptions';
import CashFlowEntity, {
	CashFlowCategoryEnum,
	CashFlowCategoryTypeEnum,
	CashFlowDirectionEnum, CashFlowGatewayEnum, CashFlowMethodEnum,
	CashFlowStatusEnum,
	CURRENCY_DEFAULT,
	CurrencyEnum,
	getExpectedCategoryType,
	getExpectedDirection, REFUNDABLE_STATUSES
} from '@/features/cash-flow/cash-flow.entity';
import {getCashFlowRepository} from '@/features/cash-flow/cash-flow.repository';
import {type CashFlowValidator, paramsUpdateList,} from '@/features/cash-flow/cash-flow.validator';
import type {ValidatorOutput} from '@/shared/abstracts/validator.abstract';
import dataSource from "@/config/data-source.config";

type CreateEntry = {
	direction: CashFlowDirectionEnum,
	category_type: CashFlowCategoryTypeEnum,
	category: CashFlowCategoryEnum,
	gateway: CashFlowGatewayEnum,
	method: CashFlowMethodEnum,
	amount: number,
	vat_rate: number,
	currency: CurrencyEnum,
	exchange_rate: number,
	external_reference?: string,
	parent_id?: number,
	notes?: string,
};

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

	private checkParentSelection(
		parent_id: number | undefined,
		category: CashFlowCategoryEnum,
	) {
		if (!parent_id && category === CashFlowCategoryEnum.REFUND) {
			throw new BadRequestError(
				lang('cash-flow.error.refund_parent_required'),
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
		amount: number,
		currency: CurrencyEnum,
		parentEntry: CashFlowEntity,
		refundedAmount: number
	}) {
		if (deps.category !== CashFlowCategoryEnum.REFUND) {
			throw new BadRequestError(
				lang('cash-flow.validation.category_invalid'),
			);
		}

		if (!REFUNDABLE_STATUSES.includes(deps.parentEntry.status)) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_parent_status_invalid', {
					status: parent.status
				}),
			);
		}

		if (deps.parentEntry.currency !== deps.currency) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_parent_same_currency'),
			);
		}

		if (deps.parentEntry.category_type === CashFlowCategoryTypeEnum.CORRECTION) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_parent_category_type_invalid'),
			);
		}

		if ([CashFlowCategoryEnum.EMPLOYEE_SALARY].includes(deps.parentEntry.category)) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_parent_category_invalid'),
			);
		}

		if (deps.parentEntry.amount < deps.amount) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_amount_mismatch', {
					max_amount: (deps.parentEntry.amount / 100).toFixed(2).toString()
				}),
			);
		}

		if (deps.refundedAmount >= deps.amount) {
			throw new CustomError(409,
				lang('cash-flow.error.refund_amount_mismatch', {
					max_amount: ((deps.parentEntry.amount - deps.refundedAmount) / 100).toFixed(2).toString()
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
		this.checkParentSelection(data.parent_id, data.category);
		this.checkAmount(data.amount);

		const entry: CreateEntry = {
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

		if (data.parent_id) {
			this.processRefund(entry);
		} else {
			this.processCreate(entry);
		}



		return dataSource.transaction(async (manager) => {
			if (entry.parent_id) {
				const refundedAmountSum = await this.getRefundedAmountSum(entry.parent_id);
			}

			const repository = manager.getRepository(CashFlowEntity); // We use the manager -> `getCashFlowRepository` is not bound to the transaction

			const parentEntry = {
				id: entry.parent_id,
				status:
			}

			return await repository.save(entry);
		});
	}

	private processCreate(entry) {
		return this.repository.save(entry);
	}

	private processRefund(data: ValidatorOutput<CashFlowValidator, 'create'>) {
		if (!data.parent_id) {
			throw new CustomError(
				500,
				lang('cash-flow.error.parent_id_invalid'),
			);
		}

		const parentEntry = await this.findById(
			data.parent_id,
			false,
		);

		const refundedAmount = await this.getRefundedAmountSum(data.parent_id);

		await this.checkRefund({
			category: data.category,
			amount: data.amount,
			currency: data.currency,
			parentEntry: parentEntry,
			refundedAmount: refundedAmount
		});
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
