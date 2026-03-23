import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export enum PermissionOrderByEnum {
	ID = 'id',
	ENTITY = 'entity',
	OPERATION = 'operation',
}

const validatorMessages = {
	invalid_entity: lang('permission.validation.invalid_entity'),
	invalid_operation: lang('permission.validation.invalid_operation'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
};

type PermissionValidatorMessages = typeof validatorMessages;

export class PermissionValidator extends BaseValidator<PermissionValidatorMessages> {
	readonly manage = z.object({
		entity: this.validateString(this.useMessage('invalid_entity')),
		operation: this.validateString(this.useMessage('invalid_operation')),
	});

	readonly find = this.validateFind({
		orderByEnum: PermissionOrderByEnum,
		defaultOrderBy: PermissionOrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: Configuration.get('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
			id: this.validateNumber(this.useMessage('invalid_number'), {
				required: false,
			}),
			term: this.validateString(this.useMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			is_deleted: this.validateBoolean(
				this.useMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

export const permissionValidator = new PermissionValidator(validatorMessages);
