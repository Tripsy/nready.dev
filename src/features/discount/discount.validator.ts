import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	DiscountReasonEnum,
	type DiscountRules,
	DiscountScopeEnum,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = [
	'label',
	'scope',
	'reason',
	'reference',
	'type',
	'rules',
	'value',
	'start_at',
	'end_at',
	'notes',
];

export enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	START_AT = 'start_at',
	END_AT = 'end_at',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

const validatorMessages = {
	invalid_label: lang('discount.validation.invalid_label'),
	invalid_scope: lang('discount.validation.invalid_scope'),
	invalid_reason: lang('discount.validation.invalid_reason'),
	invalid_reference: lang('discount.validation.invalid_reference'),
	invalid_type: lang('discount.validation.invalid_type'),
	invalid_rules: lang('discount.validation.invalid_rules'),
	invalid_value: lang('discount.validation.invalid_value'),
	invalid_start_at: lang('discount.validation.invalid_start_at'),
	invalid_end_at: lang('discount.validation.invalid_end_at'),
	end_at_must_be_after_start_at: lang(
		'discount.validation.end_at_must_be_after_start_at',
	),
	percent_must_be_between_0_and_100: lang(
		'discount.validation.percent_must_be_between_0_and_100',
	),
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
	invalid_date_range: lang('shared.validation.invalid_date_range'),
};

export class DiscountValidator extends BaseValidator<typeof validatorMessages> {
	rulesSchema: z.ZodType<DiscountRules> = z.record(
		z.string(), // Keys are strings
		z.union([
			z.number(), // Single number
			z.array(z.number()), // Array of number
			z.array(z.string()), // Array of string
		]),
	);

	readonly create = z
		.object({
			label: this.validateString(this.getMessage('invalid_label')),
			scope: this.validateEnum(
				DiscountScopeEnum,
				this.getMessage('invalid_scope'),
			),
			reason: this.validateEnum(
				DiscountReasonEnum,
				this.getMessage('invalid_reason'),
			),
			reference: this.validateString(
				this.getMessage('invalid_reference'),
			),
			type: this.validateEnum(
				DiscountTypeEnum,
				this.getMessage('invalid_type'),
			),
			rules: this.rulesSchema.optional(),
			value: this.validateNumber(this.getMessage('invalid_number'), {
				required: true,
				onlyPositive: true,
				allowDecimals: true,
			}),
			start_at: this.validateDate(this.getMessage('invalid_start_at'), {
				required: false,
				maxPastSeconds: 0,
			}),
			end_at: this.validateDate(this.getMessage('invalid_end_at'), {
				required: false,
				maxPastSeconds: 0,
			}),
			notes: this.validateString(this.getMessage('invalid_notes'), {
				required: false,
			}),
		})
		.superRefine((data, ctx) => {
			if (data.end_at && data.start_at && data.end_at <= data.start_at) {
				ctx.addIssue({
					path: ['end_at'],
					message: this.getMessage('end_at_must_be_after_start_at'),
					code: 'custom',
				});
			}

			// Validate that percent discounts are between 0 and 100
			if (
				data.type === DiscountTypeEnum.PERCENT &&
				data.value !== undefined &&
				(data.value < 0 || data.value > 100)
			) {
				ctx.addIssue({
					path: ['value'],
					message: this.getMessage(
						'percent_must_be_between_0_and_100',
					),
					code: 'custom',
				});
			}
		});

	readonly update = z
		.object({
			label: this.validateString(this.getMessage('invalid_label'), {
				required: false,
			}),
			scope: this.validateEnum(
				DiscountScopeEnum,
				this.getMessage('invalid_scope'),
				{ required: false },
			),
			reason: this.validateEnum(
				DiscountReasonEnum,
				this.getMessage('invalid_reason'),
				{ required: false },
			),
			reference: this.validateString(
				this.getMessage('invalid_reference'),
				{ required: false },
			),
			type: this.validateEnum(
				DiscountTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			),
			rules: this.rulesSchema.optional(),
			value: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
				onlyPositive: true,
				allowDecimals: true,
			}),
			start_at: this.validateDate(this.getMessage('invalid_start_at'), {
				required: false,
				maxPastSeconds: 0,
			}),
			end_at: this.validateDate(this.getMessage('invalid_end_at'), {
				required: false,
				maxPastSeconds: 0,
			}),
			notes: this.validateString(this.getMessage('invalid_notes'), {
				required: false,
			}),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: this.getMessage('params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		})
		.superRefine((data, ctx) => {
			if (data.end_at && data.start_at && data.end_at <= data.start_at) {
				ctx.addIssue({
					path: ['end_at'],
					message: this.getMessage('end_at_must_be_after_start_at'),
					code: 'custom',
				});
			}

			// Validate percent discount if type and value are provided
			if (
				data.type === DiscountTypeEnum.PERCENT &&
				data.value !== undefined &&
				(data.value < 0 || data.value > 100)
			) {
				ctx.addIssue({
					path: ['value'],
					message: this.getMessage(
						'percent_must_be_between_0_and_100',
					),
					code: 'custom',
				});
			}
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
			term: this.validateString(this.getMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			scope: this.validateEnum(
				DiscountScopeEnum,
				this.getMessage('invalid_scope'),
				{ required: false },
			),
			reason: this.validateEnum(
				DiscountReasonEnum,
				this.getMessage('invalid_reason'),
				{ required: false },
			),
			type: this.validateEnum(
				DiscountTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			),
			reference: this.validateString(this.getMessage('invalid_string'), {
				required: false,
			}),
			start_at_start: this.validateDate(
				{
					invalid_date: this.getMessage('invalid_date'),
					invalid_date_format: this.getMessage('invalid_date_format'),
					invalid_past_date: this.getMessage('invalid_past_date'),
					invalid_future_date: this.getMessage('invalid_future_date'),
				},
				{ required: false },
			),
			start_at_end: this.validateDate(
				{
					invalid_date: this.getMessage('invalid_date'),
					invalid_date_format: this.getMessage('invalid_date_format'),
					invalid_past_date: this.getMessage('invalid_past_date'),
					invalid_future_date: this.getMessage('invalid_future_date'),
				},
				{ required: false },
			),
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	}).superRefine((data, ctx) => {
		if (
			data.filter?.start_at_start &&
			data.filter?.start_at_end &&
			data.filter.start_at_start > data.filter.start_at_end
		) {
			ctx.addIssue({
				path: ['filter', 'start_at_start'],
				message: this.getMessage('invalid_date_range'),
				code: 'custom',
			});
		}
	});
}

export const discountValidator = new DiscountValidator(validatorMessages);
