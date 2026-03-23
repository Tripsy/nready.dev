import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { RequestContextSource } from '@/config/request.context';
import { Configuration } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export enum OrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	ACTION = 'action',
	RECORDED_AT = 'recorded_at',
}

const validatorMessages = {
	invalid_source: lang('log_history.validation.invalid_source'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
	invalid_date: lang('shared.validation.invalid_date'),
	invalid_date_format: lang('shared.validation.invalid_date_format'),
	invalid_past_date: lang('shared.validation.invalid_past_date'),
	invalid_future_date: lang('shared.validation.invalid_future_date'),
	invalid_date_range: lang('shared.validation.invalid_date_range'),
};

type LogHistoryValidatorMessages = typeof validatorMessages;

export class LogHistoryValidator extends BaseValidator<LogHistoryValidatorMessages> {
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
			entity: this.validateString(this.useMessage('invalid_string'), {
				required: false,
			}),
			entity_id: this.validateId(this.useMessage('invalid_number'), {
				required: false,
			}),
			action: this.validateString(this.useMessage('invalid_string'), {
				required: false,
			}),
			request_id: this.validateString(this.useMessage('invalid_string'), {
				required: false,
			}),
			source: this.validateEnum(
				RequestContextSource,
				this.useMessage('invalid_source'),
				{ required: false },
			),
			recorded_at_start: this.validateDate(
				{
					invalid_date: this.useMessage('invalid_date'),
					invalid_date_format: this.useMessage('invalid_date_format'),
					invalid_past_date: this.useMessage('invalid_past_date'),
					invalid_future_date: this.useMessage('invalid_future_date'),
				},
				{ required: false },
			),
			recorded_at_end: this.validateDate(
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
			data.filter.recorded_at_start &&
			data.filter.recorded_at_end &&
			data.filter.recorded_at_start > data.filter.recorded_at_end
		) {
			ctx.addIssue({
				path: ['filter', 'recorded_at_start'],
				message: this.useMessage('invalid_date_range'),
				code: 'custom',
			});
		}
	});
}

export const logHistoryValidator = new LogHistoryValidator(validatorMessages);
