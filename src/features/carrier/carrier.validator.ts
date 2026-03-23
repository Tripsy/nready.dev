import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = [
	'name',
	'website',
	'phone',
	'email',
	'notes',
];

export enum OrderByEnum {
	ID = 'id',
	NAME = 'name',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

const validatorMessages = {
	invalid_name: lang('carrier.validation.website_invalid'),
	invalid_website: lang('carrier.validation.invalid_website'),
	invalid_phone: lang('carrier.validation.invalid_phone'),
	invalid_email: lang('carrier.validation.invalid_email'),
	params_at_least_one: lang('shared.validation.params_at_least_one'),
	invalid_notes: lang('shared.validation.invalid_notes'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
};

export class CarrierValidator extends BaseValidator<typeof validatorMessages> {
	readonly create = z.object({
		name: this.validateString(this.getMessage('invalid_name')),
		website: this.validateString(this.getMessage('invalid_website'), {
			required: false,
		}),
		phone: this.validatePhone(this.getMessage('invalid_phone'), {
			required: false,
		}),
		email: this.validateEmail(this.getMessage('invalid_email'), {
			required: false,
		}),
		notes: this.validateString(this.getMessage('invalid_notes'), {
			required: false,
		}),
	});

	readonly update = z
		.object({
			name: this.validateString(this.getMessage('invalid_name'), {
				required: false,
			}),
			website: this.validateString(this.getMessage('invalid_website'), {
				required: false,
			}),
			phone: this.validatePhone(this.getMessage('invalid_phone'), {
				required: false,
			}),
			email: this.validateEmail(this.getMessage('invalid_email'), {
				required: false,
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
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

export const carrierValidator = new CarrierValidator(validatorMessages);
