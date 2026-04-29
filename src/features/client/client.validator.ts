import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	ClientStatusEnum,
	ClientTypeEnum,
} from '@/features/client/client.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList = [
	'client_type',
	'status',
	'company_name',
	'company_cui',
	'company_reg_com',
	'person_name',
	'person_identification_number',
	'iban',
	'bank_name',
	'contact_name',
	'contact_email',
	'contact_phone',
	'notes',
];

export const OrderByEnum = {
	ID: 'id',
	CREATED_AT: 'created_at',
} as const;

const validatorMessages = {
	invalid_iban: lang('client.validation.invalid_iban'),
	invalid_bank_name: lang('client.validation.invalid_bank_name'),
	invalid_contact_name: lang('client.validation.invalid_contact_name'),
	invalid_contact_email: lang('client.validation.invalid_contact_email'),
	invalid_contact_phone: lang('client.validation.invalid_contact_phone'),
	invalid_notes: lang('client.validation.invalid_notes'),
	invalid_company_name: lang('client.validation.invalid_company_name'),
	invalid_company_cui: lang('client.validation.invalid_company_cui'),
	invalid_company_reg_com: lang('client.validation.invalid_company_reg_com'),
	invalid_person_name: lang('client.validation.invalid_person_name'),
	invalid_person_identification_number: lang(
		'client.validation.invalid_person_identification_number',
	),
	params_at_least_one: lang('shared.validation.params_at_least_one'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
	invalid_type: lang('client.validation.invalid_type'),
	invalid_status: lang('cash-flow.validation.invalid_status'),
	invalid_date: lang('shared.validation.invalid_date'),
	invalid_date_format: lang('shared.validation.invalid_date_format'),
	invalid_past_date: lang('shared.validation.invalid_past_date'),
	invalid_future_date: lang('shared.validation.invalid_future_date'),
	invalid_date_range: lang('shared.validation.invalid_date_range'),
};

export class ClientValidator extends BaseValidator<typeof validatorMessages> {
	readonly baseSchema = {
		iban: this.validateIBAN(this.getMessage('invalid_iban'), {
			required: false,
		}),
		bank_name: this.validateString(this.getMessage('invalid_bank_name'), {
			required: false,
		}),
		contact_name: this.validateString(
			this.getMessage('invalid_contact_name'),
			{
				required: false,
			},
		),
		contact_email: this.validateEmail(
			this.getMessage('invalid_contact_email'),
			{
				required: false,
			},
		),
		contact_phone: this.validatePhone(
			this.getMessage('invalid_contact_phone'),
			{
				required: false,
			},
		),
		notes: this.validateString(this.getMessage('invalid_notes'), {
			required: false,
		}),
	};

	readonly create = z.discriminatedUnion('client_type', [
		// Company schema
		z
			.object({
				client_type: z.literal(ClientTypeEnum.COMPANY),
				company_name: this.validateString(
					this.getMessage('invalid_company_name'),
				),
				company_cui: this.validateString(
					this.getMessage('invalid_company_cui'),
				),
				company_reg_com: this.validateString(
					this.getMessage('invalid_company_reg_com'),
					{
						required: false,
					},
				),
				person_name: z.never().optional(),
				person_identification_number: z.never().optional(),
			})
			.extend(this.baseSchema),

		// Person schema
		z
			.object({
				client_type: z.literal(ClientTypeEnum.PERSON),
				company_name: z.never().optional(),
				company_cui: z.never().optional(),
				company_reg_com: z.never().optional(),
				person_name: this.validateString(
					this.getMessage('invalid_person_name'),
				),
				person_identification_number:
					this.validatePersonalIdentificationNumber(
						this.getMessage('invalid_person_identification_number'),
						{
							required: false,
						},
					),
			})
			.extend(this.baseSchema),
	]);

	readonly update = z
		.discriminatedUnion('client_type', [
			// Company schema
			z
				.object({
					client_type: z.literal(ClientTypeEnum.COMPANY),
					company_name: this.validateString(
						this.getMessage('invalid_company_name'),
						{ required: false },
					),
					company_cui: this.validateString(
						this.getMessage('invalid_company_cui'),
						{ required: false },
					),
					company_reg_com: this.validateString(
						this.getMessage('invalid_company_reg_com'),
						{
							required: false,
						},
					),
					person_name: z.never().optional(),
					person_identification_number: z.never().optional(),
				})
				.extend(this.baseSchema),

			// Person schema
			z
				.object({
					client_type: z.literal(ClientTypeEnum.PERSON),
					company_name: z.never().optional(),
					company_cui: z.never().optional(),
					company_reg_com: z.never().optional(),
					person_name: this.validateString(
						this.getMessage('invalid_person_name'),
						{ required: false },
					),
					person_identification_number:
						this.validatePersonalIdentificationNumber(
							this.getMessage(
								'invalid_person_identification_number',
							),
							{
								required: false,
							},
						),
				})
				.extend(this.baseSchema),
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
			client_type: this.validateEnum(
				ClientTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			),
			status: this.validateEnum(
				ClientStatusEnum,
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
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	}).superRefine((data, ctx) => {
		if (
			data.filter?.create_at_start &&
			data.filter?.create_at_end &&
			data.filter.create_at_start > data.filter.create_at_end
		) {
			ctx.addIssue({
				path: ['filter', 'create_at_start'],
				message: this.getMessage('invalid_date_range'),
				code: 'custom',
			});
		}
	});
}

export const clientValidator = new ClientValidator(validatorMessages);
