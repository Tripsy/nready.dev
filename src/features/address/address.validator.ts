import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = ['details', 'postal_code'];

export const OrderByEnum = {
	ID: 'id',
} as const;

const validatorMessages = {
	invalid_city_id: lang('address.validation.invalid_city_id'),
	invalid_details: lang('address.validation.invalid_details'),
	invalid_postal_code: lang('address.validation.invalid_postal_code'),
	params_at_least_one: lang('shared.validation.params_at_least_one'),
	invalid_language: lang('shared.validation.invalid_language'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
};

export class AddressValidator extends BaseValidator<typeof validatorMessages> {
	readonly read = z.object({
		language: this.validateLanguage(this.getMessage('invalid_language'), {
			required: false,
		}).default(Configuration.language()),
	});

	readonly create = z.object({
		city_id: this.validateId(this.getMessage('invalid_city_id'), {
			required: false,
		}),
		details: this.validateString(this.getMessage('invalid_details')),
		postal_code: this.validatePostalCode(
			this.getMessage('invalid_postal_code'),
			{ required: false },
		),
	});

	readonly update = z
		.object({
			city_id: this.validateId(this.getMessage('invalid_city_id'), {
				required: false,
			}),
			details: this.validateString(this.getMessage('invalid_details'), {
				required: false,
			}),
			postal_code: this.validatePostalCode(
				this.getMessage('invalid_postal_code'),
				{ required: false },
			),
		})
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
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

export const addressValidator = new AddressValidator(validatorMessages);
