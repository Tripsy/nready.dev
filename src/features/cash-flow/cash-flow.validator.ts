import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	CashFlowCategoryEnum,
	CashFlowCategoryTypeEnum,
	CashFlowDirectionEnum,
	CashFlowGatewayEnum,
	CashFlowMethodEnum,
	CashFlowStatusEnum,
	CurrencyEnum,
} from '@/features/cash-flow/cash-flow.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = [
	'direction',
	'category_type',
	'category',
	'gateway',
	'method',
	'amount',
	'vat_rate',
	'currency',
	'external_reference',
	'notes',
];

export enum OrderByEnum {
	ID = 'id',
	CATEGORY = 'category',
	METHOD = 'method',
	CREATED_AT = 'created_at',
}

const validatorMessages = {
	invalid_direction: lang('cash-flow.validation.invalid_direction'),
	invalid_category_type: lang('cash-flow.validation.invalid_category_type'),
	invalid_category: lang('cash-flow.validation.invalid_category'),
	invalid_gateway: lang('cash-flow.validation.invalid_gateway'),
	invalid_method: lang('cash-flow.validation.invalid_method'),
	invalid_amount: lang('cash-flow.validation.invalid_amount'),
	invalid_vat_rate: lang('cash-flow.validation.invalid_vat_rate'),
	invalid_currency: lang('cash-flow.validation.invalid_currency'),
	invalid_exchange_rate: lang('cash-flow.validation.invalid_exchange_rate'),
	invalid_external_reference: lang(
		'cash-flow.validation.invalid_external_reference',
	),
	invalid_parent_id: lang('cash-flow.validation.invalid_parent_id'),
	invalid_notes: lang('shared.validation.invalid_notes'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
	invalid_status: lang('cash-flow.validation.invalid_status'),
	invalid_date: lang('shared.validation.invalid_date'),
	invalid_date_format: lang('shared.validation.invalid_date_format'),
	invalid_past_date: lang('shared.validation.invalid_past_date'),
	invalid_future_date: lang('shared.validation.invalid_future_date'),
};

type CashFlowValidatorMessages = typeof validatorMessages;

export class CashFlowValidator extends BaseValidator<CashFlowValidatorMessages> {
	readonly create = z.object({
		direction: this.validateEnum(
			CashFlowDirectionEnum,
			this.useMessage('invalid_direction'),
		),
		category_type: this.validateEnum(
			CashFlowCategoryTypeEnum,
			this.useMessage('invalid_category_type'),
		),
		category: this.validateEnum(
			CashFlowCategoryEnum,
			this.useMessage('invalid_category'),
		),
		gateway: this.validateEnum(
			CashFlowGatewayEnum,
			this.useMessage('invalid_gateway'),
		),
		method: this.validateEnum(
			CashFlowMethodEnum,
			this.useMessage('invalid_method'),
		),
		amount: this.validateNumber(this.useMessage('invalid_amount')),
		vat_rate: this.validateNumber(this.useMessage('invalid_vat_rate'), {
			required: true,
			onlyPositive: true,
			allowDecimals: true,
		}),
		currency: this.validateEnum(
			CurrencyEnum,
			this.useMessage('invalid_currency'),
		),
		external_reference: this.validateString(
			this.useMessage('invalid_external_reference'),
			{ required: false },
		),
		parent_id: this.validateId(this.useMessage('invalid_parent_id'), {
			required: false,
		}),
		notes: this.validateString(this.useMessage('invalid_notes'), {
			required: false,
		}),
	});

	readonly update = z
		.object({
			direction: this.validateEnum(
				CashFlowDirectionEnum,
				this.useMessage('invalid_direction'),
				{ required: false },
			),
			category_type: this.validateEnum(
				CashFlowCategoryTypeEnum,
				this.useMessage('invalid_category_type'),
				{ required: false },
			),
			category: this.validateEnum(
				CashFlowCategoryEnum,
				this.useMessage('invalid_category'),
				{ required: false },
			),
			gateway: this.validateEnum(
				CashFlowGatewayEnum,
				this.useMessage('invalid_gateway'),
				{ required: false },
			),
			method: this.validateEnum(
				CashFlowMethodEnum,
				this.useMessage('invalid_method'),
				{ required: false },
			),
			amount: this.validateNumber(this.useMessage('invalid_amount')),
			vat_rate: this.validateNumber(this.useMessage('invalid_vat_rate'), {
				required: false,
				onlyPositive: true,
				allowDecimals: true,
			}),
			currency: this.validateEnum(
				CurrencyEnum,
				this.useMessage('invalid_currency'),
				{ required: false },
			),
			external_reference: this.validateString(
				this.useMessage('invalid_external_reference'),
				{ required: false },
			),
			notes: this.validateString(this.useMessage('invalid_notes'), {
				required: false,
			}),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: lang('shared.validation.params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		});

	readonly delete = z.object({
		// Used to force deletion even when selected entry has refunds (which will also be deleted)
		force: this.validateBoolean().default(false),
	});

	readonly find = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: Configuration.get('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
			id: this.validateNumber(this.useMessage('invalid_number'), {
				required: false,
			}),
			direction: this.validateEnum(
				CashFlowDirectionEnum,
				this.useMessage('invalid_direction'),
				{ required: false },
			),
			category_type: this.validateEnum(
				CashFlowCategoryTypeEnum,
				this.useMessage('invalid_category_type'),
				{ required: false },
			),
			category: this.validateEnum(
				CashFlowCategoryEnum,
				this.useMessage('invalid_category'),
				{ required: false },
			),
			gateway: this.validateEnum(
				CashFlowGatewayEnum,
				this.useMessage('invalid_gateway'),
				{ required: false },
			),
			method: this.validateEnum(
				CashFlowMethodEnum,
				this.useMessage('invalid_method'),
				{ required: false },
			),
			status: this.validateEnum(
				CashFlowStatusEnum,
				this.useMessage('invalid_status'),
				{ required: false },
			),
			create_date_start: this.validateDate(
				{
					invalid_date: this.useMessage('invalid_date'),
					invalid_date_format: this.useMessage('invalid_date_format'),
					invalid_past_date: this.useMessage('invalid_past_date'),
					invalid_future_date: this.useMessage('invalid_future_date'),
				},
				{ required: false },
			),
			create_date_end: this.validateDate(
				{
					invalid_date: this.useMessage('invalid_date'),
					invalid_date_format: this.useMessage('invalid_date_format'),
					invalid_past_date: this.useMessage('invalid_past_date'),
					invalid_future_date: this.useMessage('invalid_future_date'),
				},
				{ required: false },
			),
			term: this.validateString(this.useMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			is_deleted: this.validateBoolean(
				this.useMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

export const cashFlowValidator = new CashFlowValidator(validatorMessages);
