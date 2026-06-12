import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	AMOUNT_DECIMALS,
	CashFlowCategoryTypeEnum,
	CashFlowDirectionEnum,
	CashFlowMethodEnum,
	CashFlowStatusEnum,
	CurrencyEnum,
} from '@/features/cash-flow/cash-flow.entity';
import { CashFlowCategoryEnum } from '@/features/cash-flow/cash-flow-category.enum';
import { OperationalRecordTypeEnum } from '@/features/cash-flow/operational-record.entity';
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
	// operational record
	'client_id',
	'vendor_id',
	'employee_id',
	'company_vehicle_id',
];

export const OrderByEnum = {
	ID: 'id',
	CATEGORY: 'category',
	METHOD: 'method',
	CREATED_AT: 'created_at',
} as const;

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
	params_at_least_one: lang('shared.validation.params_at_least_one'),
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

export class CashFlowValidator extends BaseValidator<typeof validatorMessages> {
	readonly operationalRecords = z
		.object({
			[OperationalRecordTypeEnum.CLIENT]: this.validateId(
				this.getMessage('invalid_number'),
				{ required: false },
			),
			[OperationalRecordTypeEnum.VENDOR]: this.validateId(
				this.getMessage('invalid_number'),
				{ required: false },
			),
			[OperationalRecordTypeEnum.EMPLOYEE]: this.validateId(
				this.getMessage('invalid_number'),
				{ required: false },
			),
		})
		.optional();

	readonly create = z.object({
		direction: this.validateEnum(
			CashFlowDirectionEnum,
			this.getMessage('invalid_direction'),
		),
		category_type: this.validateEnum(
			CashFlowCategoryTypeEnum,
			this.getMessage('invalid_category_type'),
		),
		category: this.validateEnum(
			CashFlowCategoryEnum,
			this.getMessage('invalid_category'),
		),
		method: this.validateEnum(
			CashFlowMethodEnum,
			this.getMessage('invalid_method'),
		),
		amount: this.validateNumber(this.getMessage('invalid_amount'), {
			required: true,
			onlyPositive: false,
			allowDecimals: AMOUNT_DECIMALS,
		}),
		vat_rate: this.validateNumber(this.getMessage('invalid_vat_rate'), {
			required: true,
			onlyPositive: true,
			allowDecimals: 2,
		}),
		currency: this.validateEnum(
			CurrencyEnum,
			this.getMessage('invalid_currency'),
		),
		external_reference: this.validateString(
			this.getMessage('invalid_external_reference'),
			{ required: false },
		),
		parent_id: this.validateId(this.getMessage('invalid_parent_id'), {
			required: false,
		}),
		notes: this.validateString(this.getMessage('invalid_notes'), {
			required: false,
		}),
		operational_records: this.operationalRecords,
	});

	readonly update = z
		.object({
			direction: this.validateEnum(
				CashFlowDirectionEnum,
				this.getMessage('invalid_direction'),
				{ required: false },
			),
			category_type: this.validateEnum(
				CashFlowCategoryTypeEnum,
				this.getMessage('invalid_category_type'),
				{ required: false },
			),
			category: this.validateEnum(
				CashFlowCategoryEnum,
				this.getMessage('invalid_category'),
				{ required: false },
			),
			method: this.validateEnum(
				CashFlowMethodEnum,
				this.getMessage('invalid_method'),
				{ required: false },
			),
			amount: this.validateNumber(this.getMessage('invalid_amount'), {
				required: true,
				onlyPositive: false,
				allowDecimals: AMOUNT_DECIMALS,
			}),
			vat_rate: this.validateNumber(this.getMessage('invalid_vat_rate'), {
				required: false,
				onlyPositive: true,
				allowDecimals: 2,
			}),
			currency: this.validateEnum(
				CurrencyEnum,
				this.getMessage('invalid_currency'),
				{ required: false },
			),
			external_reference: this.validateString(
				this.getMessage('invalid_external_reference'),
				{ required: false },
			),
			notes: this.validateString(this.getMessage('invalid_notes'), {
				required: false,
			}),
			operational_records: this.operationalRecords,
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: this.getMessage('params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		});

	readonly delete = z.object({
		// Used to force deletion even when selected entry has refunds (which will also be deleted)
		force: this.validateBoolean(this.getMessage('invalid_boolean'), {
			required: false,
		}).default(false),
	});

	readonly find = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: Configuration.get('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
			id: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
			}),
			parent_id: this.validateId(this.getMessage('invalid_parent_id'), {
				required: false,
			}),
			direction: this.validateEnum(
				CashFlowDirectionEnum,
				this.getMessage('invalid_direction'),
				{ required: false },
			),
			category_type: this.validateEnum(
				CashFlowCategoryTypeEnum,
				this.getMessage('invalid_category_type'),
				{ required: false },
			),
			category: this.validateEnum(
				CashFlowCategoryEnum,
				this.getMessage('invalid_category'),
				{ required: false },
			),
			method: this.validateEnum(
				CashFlowMethodEnum,
				this.getMessage('invalid_method'),
				{ required: false },
			),
			status: this.validateEnum(
				CashFlowStatusEnum,
				this.getMessage('invalid_status'),
				{ required: false },
			),
			create_at_start: this.validateDate(
				{
					invalid_date: this.getMessage('invalid_date'),
					invalid_date_format: this.getMessage('invalid_date_format'),
					invalid_past_date: this.getMessage('invalid_past_date'),
					invalid_future_date: this.getMessage('invalid_future_date'),
				},
				{ required: false },
			),
			create_at_end: this.validateDate(
				{
					invalid_date: this.getMessage('invalid_date'),
					invalid_date_format: this.getMessage('invalid_date_format'),
					invalid_past_date: this.getMessage('invalid_past_date'),
					invalid_future_date: this.getMessage('invalid_future_date'),
				},
				{ required: false },
			),
			term: this.validateString(this.getMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			client_id: this.validateId(this.getMessage('invalid_number'), {
				required: false,
			}),
			employee_id: this.validateId(this.getMessage('invalid_number'), {
				required: false,
			}),
			vendor_id: this.validateId(this.getMessage('invalid_number'), {
				required: false,
			}),
			company_vehicle_id: this.validateId(
				this.getMessage('invalid_number'),
				{
					required: false,
				},
			),
			cmr_id: this.validateId(this.getMessage('invalid_number'), {
				required: false,
			}),
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

export const cashFlowValidator = new CashFlowValidator(validatorMessages);
