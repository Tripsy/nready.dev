import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const OrderByEnum = {
	ID: 'id',
	ENTITY: 'entity',
	OPERATION: 'operation',
} as const;

const validatorMessages = {
	invalid_entity: lang('permission.validation.invalid_entity'),
	invalid_operation: lang('permission.validation.invalid_operation'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
};

export class PermissionValidator extends BaseValidator<
	typeof validatorMessages
> {
	readonly manage = z.object({
		entity: this.validateString(this.getMessage('invalid_entity')),
		operation: this.validateString(this.getMessage('invalid_operation')),
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

export const permissionValidator = new PermissionValidator(validatorMessages);
