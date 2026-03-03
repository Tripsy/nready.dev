import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	ClientStatusEnum,
	ClientTypeEnum,
} from '@/features/client/client.entity';
import { getPlaceRepository } from '@/features/place/place.repository';
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
	'person_cnp',
	'iban',
	'bank_name',
	'contact_name',
	'contact_email',
	'contact_phone',
	'address_country',
	'address_region',
	'address_city',
	'address_info',
	'address_postal_code',
	'notes',
];

export enum OrderByEnum {
	ID = 'id',
	CREATED_AT = 'created_at',
}

export class ClientValidator extends BaseValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	public create() {
		const ClientCreateBaseValidator = z.object({
			client_type: this.validateEnum(
				ClientTypeEnum,
				lang('client.validation.client_type_invalid'),
			),
			iban: this.validateString(
				lang('client.validation.iban_invalid'),
			).optional(),
			bank_name: this.validateString(
				lang('client.validation.bank_name_invalid'),
			).optional(),
			contact_name: this.validateString(
				lang('client.validation.contact_name_invalid'),
			).optional(),
			contact_email: z
				.email({
					message: lang('client.validation.contact_email_invalid'),
				})
				.optional(),
			contact_phone: this.validateString(
				lang('client.validation.contact_phone_invalid'),
			).optional(),
			address_country: this.validateNumber(
				lang('client.validation.address_country_invalid'),
			).optional(),
			address_region: this.validateNumber(
				lang('client.validation.address_region_invalid'),
			).optional(),
			address_city: this.validateNumber(
				lang('client.validation.address_city_invalid'),
			).optional(),
			address_info: this.validateString(
				lang('client.validation.address_info_invalid'),
			).optional(),
			address_postal_code: this.validateNumber(
				lang('client.validation.address_postal_code_invalid'),
			).optional(),
			notes: this.validateString(
				lang('carrier.validation.notes_invalid'),
			).optional(),
		});

		const ClientCreateCompanyValidator = ClientCreateBaseValidator.extend({
			client_type: z.literal(ClientTypeEnum.COMPANY),
			company_name: this.validateString(
				lang('client.validation.company_name_invalid'),
			),
			company_cui: this.validateString(
				lang('client.validation.company_cui_invalid'),
			).transform((v) => v.trim().toUpperCase()),
			company_reg_com: this.validateString(
				lang('client.validation.company_reg_com_invalid'),
			).transform((v) => v.trim().toUpperCase()),
		});

		const ClientCreatePersonValidator = ClientCreateBaseValidator.extend({
			client_type: z.literal(ClientTypeEnum.PERSON),
			person_name: this.validateString(
				lang('client.validation.person_name_invalid'),
			),
			person_cnp: this.validateString(
				lang('client.validation.person_cnp_invalid'),
			).optional(),
		});

		return z
			.union([ClientCreateCompanyValidator, ClientCreatePersonValidator])
			.superRefine(async (data, ctx) => {
				await this.validateAddressPlaceTypes(data, ctx, (id, type) =>
					getPlaceRepository().checkPlaceType(id, type),
				);
			});
	}

	update() {
		const ClientUpdateBaseValidator = z.object({
			client_type: this.validateEnum(
				ClientTypeEnum,
				lang('client.validation.client_type_invalid'),
			),
			iban: this.validateString(
				lang('client.validation.iban_invalid'),
			).optional(),
			bank_name: this.validateString(
				lang('client.validation.bank_name_invalid'),
			).optional(),
			contact_name: this.validateString(
				lang('client.validation.contact_name_invalid'),
			).optional(),
			contact_email: z
				.email({
					message: lang('client.validation.contact_email_invalid'),
				})
				.optional(),
			contact_phone: this.validateString(
				lang('client.validation.contact_phone_invalid'),
			).optional(),
			address_country: this.validateNumber(
				lang('client.validation.address_country_invalid'),
			).optional(),
			address_region: this.validateNumber(
				lang('client.validation.address_region_invalid'),
			).optional(),
			address_city: this.validateNumber(
				lang('client.validation.address_city_invalid'),
			).optional(),
			address_info: this.validateString(
				lang('client.validation.address_info_invalid'),
			).optional(),
			address_postal_code: this.validateString(
				lang('client.validation.address_postal_code_invalid'),
			).optional(),
			notes: this.validateString(
				lang('client.validation.notes_invalid'),
			).optional(),
		});

		const ClientUpdateCompanyValidator = ClientUpdateBaseValidator.extend({
			client_type: z.literal(ClientTypeEnum.COMPANY),
			company_name: this.validateString(
				lang('client.validation.company_name_invalid'),
			).optional(),
			company_cui: this.validateString(
				lang('client.validation.company_cui_invalid'),
			).optional(),
			company_reg_com: this.validateString(
				lang('client.validation.company_reg_com_invalid'),
			).optional(),
		});

		const ClientUpdatePersonValidator = ClientUpdateBaseValidator.extend({
			client_type: z.literal(ClientTypeEnum.PERSON),
			person_name: this.validateString(
				lang('client.validation.person_name_invalid'),
			).optional(),
			person_cnp: this.validateString(
				lang('client.validation.person_cnp_invalid'),
			).optional(),
		});

		return z
			.union([ClientUpdateCompanyValidator, ClientUpdatePersonValidator])
			.refine((data) => hasAtLeastOneValue(data), {
				message: lang('shared.validation.params_at_least_one', {
					params: paramsUpdateList.join(', '),
				}),
				path: ['_global'],
			})
			.superRefine(async (data, ctx) => {
				await this.validateAddressPlaceTypes(data, ctx, (id, type) =>
					getPlaceRepository().checkPlaceType(id, type),
				);
			});
	}

	find() {
		return this.makeFindValidator({
			orderByEnum: OrderByEnum,
			defaultOrderBy: OrderByEnum.ID,

			directionEnum: OrderDirectionEnum,
			defaultDirection: OrderDirectionEnum.ASC,

			defaultLimit: this.defaultFilterLimit,
			defaultPage: 1,

			filterShape: {
				id: z.coerce
					.number({
						message: lang('shared.validation.invalid_number'),
					})
					.optional(),
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.optional(),
				client_type: z.enum(ClientTypeEnum).optional(),
				status: z.enum(ClientStatusEnum).optional(),
				create_date_start: this.validateDate(),
				create_date_end: this.validateDate(),
				is_deleted: this.validateBoolean().default(false),
			},
		}).superRefine((data, ctx) => {
			if (
				data.filter.create_date_start &&
				data.filter.create_date_end &&
				data.filter.create_date_start > data.filter.create_date_end
			) {
				ctx.addIssue({
					path: ['filter', 'create_date_start'],
					message: lang('shared.validation.invalid_date_range'),
					code: 'custom',
				});
			}
		});
	}
}

export const clientValidator = new ClientValidator();
