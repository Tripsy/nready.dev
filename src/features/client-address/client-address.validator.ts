import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { ClientAddressTypeEnum } from '@/features/client-address/client-address.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = [
	'address_type',
	'address_city_id',
	'address_info',
	'address_postal_code',
	'notes',
];

export enum OrderByEnum {
	ID = 'id',
}

export class ClientAddressValidator extends BaseValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	public create() {
		return z.object({
			address_type: this.validateEnum(
				ClientAddressTypeEnum,
				lang('client.validation.address_type_invalid'),
			),
			address_city_id: this.validateNumber(
				lang('client-address.validation.address_city_id_invalid'),
			).optional(),
			address_info: this.validateString(
				lang('client-address.validation.address_info_invalid'),
			),
			address_postal_code: this.validateNumber(
				lang('client-address.validation.address_postal_code_invalid'),
			).optional(),
			notes: this.validateString(
				lang('client-address.validation.notes_invalid'),
			).optional(),
		});
	}

	public update() {
		return z
			.object({
				address_type: this.validateEnum(
					ClientAddressTypeEnum,
					lang('client.validation.address_type_invalid'),
				).optional(),
				address_city_id: this.validateNumber(
					lang('client-address.validation.address_city_id_invalid'),
				).optional(),
				address_info: this.validateString(
					lang('client-address.validation.address_info_invalid'),
				),
				address_postal_code: this.validateNumber(
					lang(
						'client-address.validation.address_postal_code_invalid',
					),
				).optional(),
				notes: this.validateString(
					lang('client-address.validation.notes_invalid'),
				).optional(),
			})
			.refine((data) => hasAtLeastOneValue(data), {
				message: lang('shared.validation.params_at_least_one', {
					params: paramsUpdateList.join(', '),
				}),
				path: ['_global'],
			});
	}

	public find() {
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
				client_id: z.coerce
					.number({
						message: lang('shared.validation.invalid_number'),
					})
					.optional(),
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.optional(),
				address_type: z.enum(ClientAddressTypeEnum).optional(),
				language: this.validateLanguage().optional(),
				is_deleted: this.validateBoolean().default(false),
			},
		});
	}
}

export const clientAddressValidator = new ClientAddressValidator();
