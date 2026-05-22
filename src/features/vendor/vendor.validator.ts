import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { VendorStatusEnum } from '@/features/vendor/vendor.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = ['name'];

export const OrderByEnum = {
	ID: 'id',
	MODEL: 'model',
} as const;

const validatorMessages = {
	invalid_name: lang('vendor.validation.invalid_name'),

	params_at_least_one: lang('shared.validation.params_at_least_one'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_status: lang('shared.validation.invalid_status'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
};

export class VendorValidator extends BaseValidator<typeof validatorMessages> {
	readonly create = z.object({
		name: this.validateString(this.getMessage('invalid_name')),
	});

	readonly update = z
		.object({
			name: this.validateString(this.getMessage('invalid_name'), {
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
			status: this.validateEnum(
				VendorStatusEnum,
				this.getMessage('invalid_status'),
				{ required: false },
			),
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

export const vendorValidator = new VendorValidator(validatorMessages);
