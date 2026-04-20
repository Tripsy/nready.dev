import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { TemplateTypeEnum } from '@/features/template/template.entity';
import { hasAtLeastOneValue, safeHtml } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = [
	'label',
	'language',
	'type',
	'content',
];

export const OrderByEnum = {
	ID: 'id',
	LABEL: 'label',
	CREATED_AT: 'created_at',
	UPDATED_AT: 'updated_at',
} as const;

const validatorMessages = {
	invalid_label: lang('template.validation.invalid_label'),
	invalid_language: lang('template.validation.invalid_language'),
	invalid_type: lang('template.validation.invalid_type'),
	invalid_email_subject: lang('template.validation.invalid_email_subject'),
	invalid_email_text: lang('template.validation.invalid_email_text'),
	invalid_email_html: lang('template.validation.invalid_email_html'),
	invalid_email_layout: lang('template.validation.invalid_email_layout'),
	invalid_page_title: lang('template.validation.invalid_page_title'),
	invalid_page_html: lang('template.validation.invalid_page_html'),
	invalid_page_layout: lang('template.validation.invalid_page_layout'),
	params_at_least_one: lang('shared.validation.params_at_least_one'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
};

export class TemplateValidator extends BaseValidator<typeof validatorMessages> {
	readonly baseCreateSchema = {
		label: this.validateString(this.getMessage('invalid_label')),
		language: this.validateLanguage(this.getMessage('invalid_language')),
	};

	readonly baseUpdateSchema = {
		label: this.validateString(this.getMessage('invalid_label'), {
			required: false,
		}),
		language: this.validateLanguage(this.getMessage('invalid_language'), {
			required: false,
		}),
	};

	readonly create = z.discriminatedUnion('type', [
		// Email schema
		z
			.object({
				type: z.literal(TemplateTypeEnum.EMAIL),
				content: z.object({
					subject: this.validateString(
						this.getMessage('invalid_email_subject'),
					),
					text: this.validateString(
						this.getMessage('invalid_email_text'),
						{ required: false },
					),
					html: this.validateString(
						this.getMessage('invalid_email_html'),
					).transform((val) => safeHtml(val)),
					layout: this.validateString(
						this.getMessage('invalid_email_layout'),
						{ required: false },
					).default('default'),
				}),
			})
			.extend(this.baseCreateSchema),

		// Page schema
		z
			.object({
				type: z.literal(TemplateTypeEnum.PAGE),
				content: z.object({
					title: this.validateString(
						this.getMessage('invalid_page_title'),
					),
					html: this.validateString(
						this.getMessage('invalid_page_html'),
					).transform((val) => safeHtml(val)),
					layout: this.validateString(
						this.getMessage('invalid_page_layout'),
						{ required: false },
					).default('default'),
				}),
			})
			.extend(this.baseCreateSchema),
	]);

	readonly update = z
		.discriminatedUnion('type', [
			// Email schema
			z
				.object({
					type: z.literal(TemplateTypeEnum.EMAIL),
					content: z
						.object({
							subject: this.validateString(
								this.getMessage('invalid_email_subject'),
								{ required: false },
							),
							text: this.validateString(
								this.getMessage('invalid_email_text'),
								{ required: false },
							),
							html: this.validateString(
								this.getMessage('invalid_email_html'),
								{ required: false },
							).transform((val) =>
								val ? safeHtml(val) : undefined,
							),
							layout: this.validateString(
								this.getMessage('invalid_email_layout'),
								{ required: false },
							).default('default'),
						})
						.optional(),
				})
				.extend(this.baseUpdateSchema),

			// Page schema
			z
				.object({
					type: z.literal(TemplateTypeEnum.PAGE),
					content: z
						.object({
							title: this.validateString(
								this.getMessage('invalid_page_title'),
								{ required: false },
							),
							html: this.validateString(
								this.getMessage('invalid_page_html'),
								{ required: false },
							).transform((val) =>
								val ? safeHtml(val) : undefined,
							),
							layout: this.validateString(
								this.getMessage('invalid_page_layout'),
								{ required: false },
							).default('default'),
						})
						.optional(),
				})
				.extend(this.baseUpdateSchema),
		])
		.refine((data) => hasAtLeastOneValue(data), {
			message: this.getMessage('params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
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
			language: this.validateLanguage(
				this.getMessage('invalid_language'),
				{ required: false },
			),
			type: this.validateEnum(
				TemplateTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			),
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

export const templateValidator = new TemplateValidator(validatorMessages);
