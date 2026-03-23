import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export enum UserPermissionOrderByEnum {
	ID = 'id',
	PERMISSION_ID = 'permission_id',
	ENTITY = 'permission.entity',
	OPERATION = 'permission.operation',
}

const validatorMessages = {
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
};

export class UserPermissionValidator extends BaseValidator<
	typeof validatorMessages
> {
	readonly create = z.object({
		permission_ids: z
			.array(
				z
					.number({
						message: lang('shared.validation.invalid_ids', {
							name: 'ids',
						}),
					})
					.positive(),
			)
			.min(1, {
				message: lang('shared.validation.array_min', {
					name: 'permission_ids',
					length: '1',
				}),
			}),
	});

	readonly find = this.validateFind({
		orderByEnum: UserPermissionOrderByEnum,
		defaultOrderBy: UserPermissionOrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: Configuration.get('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
			user_id: this.validateId(this.getMessage('invalid_number'), {
				required: false,
			}),
			entity: this.validateString(this.getMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			operation: this.validateString(this.getMessage('invalid_string'), {
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

export const userPermissionValidator = new UserPermissionValidator(
	validatorMessages,
);
