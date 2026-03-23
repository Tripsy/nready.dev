import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { MailQueueStatusEnum } from '@/features/mail-queue/mail-queue.entity';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export enum OrderByEnum {
	ID = 'id',
	TEMPLATE_ID = 'template_id',
	SENT_AT = 'sent_at',
}

const validatorMessages = {
	invalid_language: lang('shared.validation.invalid_language'),
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

type MailQueueValidatorMessages = typeof validatorMessages;

export class MailQueueValidator extends BaseValidator<MailQueueValidatorMessages> {
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
			template: z.union([z.string(), z.number()]).optional(),
			language: this.validateLanguage(
				this.useMessage('invalid_language'),
				{ required: false },
			),
			status: this.validateEnum(
				MailQueueStatusEnum,
				this.useMessage('invalid_status'),
				{ required: false },
			),
			content: this.validateString(this.useMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			to: this.validateString(this.useMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			sent_date_start: this.validateDate(
				{
					invalid_date: this.useMessage('invalid_date'),
					invalid_date_format: this.useMessage('invalid_date_format'),
					invalid_past_date: this.useMessage('invalid_past_date'),
					invalid_future_date: this.useMessage('invalid_future_date'),
				},
				{ required: false },
			),
			sent_date_end: this.validateDate(
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
			data.filter.sent_date_start &&
			data.filter.sent_date_end &&
			data.filter.sent_date_start > data.filter.sent_date_end
		) {
			ctx.addIssue({
				path: ['filter', 'sent_date_start'],
				message: this.useMessage('invalid_date_range'),
				code: 'custom',
			});
		}
	});
}

export const mailQueueValidator = new MailQueueValidator(validatorMessages);
