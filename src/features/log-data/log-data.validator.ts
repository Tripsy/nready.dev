import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { LogDataCategoryEnum } from '@/features/log-data/log-data.entity';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';
import { LogDataLevelEnum } from '@/shared/types/log-data.type';

export enum OrderByEnum {
	ID = 'id',
	REQUEST_ID = 'request_id',
	CATEGORY = 'category',
	LEVEL = 'level',
	CREATED_AT = 'created_at',
}

const validatorMessages = {
	invalid_category: lang('log_data.validation.invalid_category'),
	invalid_level: lang('log_data.validation.invalid_level'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
	invalid_date: lang('shared.validation.invalid_date'),
	invalid_date_format: lang('shared.validation.invalid_date_format'),
	invalid_past_date: lang('shared.validation.invalid_past_date'),
	invalid_future_date: lang('shared.validation.invalid_future_date'),
	invalid_date_range: lang('shared.validation.invalid_date_range'),
};

type LogDataValidatorMessages = typeof validatorMessages;

export class LogDataValidator extends BaseValidator<LogDataValidatorMessages> {
	readonly delete = z.object({
		ids: z.array(
			z.coerce
				.number({
					message: lang('shared.validation.invalid_ids', {
						name: 'ids',
					}),
				})
				.positive(),
			{
				message: lang('shared.validation.invalid_ids', {
					name: 'ids',
				}),
			},
		),
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
			category: this.validateEnum(
				LogDataCategoryEnum,
				this.useMessage('invalid_category'),
				{ required: false },
			),
			level: this.validateEnum(
				LogDataLevelEnum,
				this.useMessage('invalid_level'),
				{ required: false },
			),
			term: this.validateString(this.useMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
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
		},
	}).superRefine((data, ctx) => {
		if (
			data.filter.create_date_start &&
			data.filter.create_date_end &&
			data.filter.create_date_start > data.filter.create_date_end
		) {
			ctx.addIssue({
				path: ['filter', 'create_date_start'],
				message: this.useMessage('invalid_date_range'),
				code: 'custom',
			});
		}
	});
}

export const logDataValidator = new LogDataValidator(validatorMessages);
