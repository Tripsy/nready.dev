import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { ClientAddressTypeEnum } from '@/features/client-address/client-address.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = [
	'address_type',
	'city_id',
	'details',
	'postal_code',
	'notes',
];

export enum OrderByEnum {
	ID = 'id',
}

const validatorMessages = {
	invalid_address_type: lang(
		'client-address.validation.invalid_address_type',
	),
	invalid_city_id: lang('client-address.validation.invalid_city_id'),
	invalid_details: lang('client-address.validation.invalid_details'),
	invalid_postal_code: lang('client-address.validation.invalid_postal_code'),
	invalid_notes: lang('client-address.validation.invalid_notes'),
	invalid_language: lang('shared.validation.invalid_language'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
};

type ClientAddressValidatorMessages = typeof validatorMessages;

export class ClientAddressValidator extends BaseValidator<ClientAddressValidatorMessages> {
	readonly create = z.object({
		address_type: this.validateEnum(
			ClientAddressTypeEnum,
			this.useMessage('invalid_address_type'),
		),
		city_id: this.validateId(this.useMessage('invalid_city_id'), {
			required: false,
		}),
		details: this.validateString(this.useMessage('invalid_details')),
		postal_code: this.validatePostalCode(
			this.useMessage('invalid_postal_code'),
			{ required: false },
		),
		notes: this.validateString(this.useMessage('invalid_notes'), {
			required: false,
		}),
	});

	readonly update = z
		.object({
			address_type: this.validateEnum(
				ClientAddressTypeEnum,
				this.useMessage('invalid_address_type'),
				{ required: false },
			),
			city_id: this.validateId(this.useMessage('invalid_city_id'), {
				required: false,
			}),
			details: this.validateString(this.useMessage('invalid_details'), {
				required: false,
			}),
			postal_code: this.validatePostalCode(
				this.useMessage('invalid_postal_code'),
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
			client_id: this.validateId(this.useMessage('invalid_number'), {
				required: false,
			}),
			term: this.validateString(this.useMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			address_type: this.validateEnum(
				ClientAddressTypeEnum,
				this.useMessage('invalid_address_type'),
				{ required: false },
			),
			language: this.validateLanguage(
				this.useMessage('invalid_language'),
				{ required: false },
			),
			is_deleted: this.validateBoolean(
				this.useMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

export const clientAddressValidator = new ClientAddressValidator(
	validatorMessages,
);
