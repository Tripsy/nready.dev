import { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

export const OrderByEnum = {
	ID: 'id',
	PERMISSION_ID: 'permission_id',
	ENTITY: 'permission.entity',
	OPERATION: 'permission.operation',
} as const;

const validatorMessages = [...sharedValidatorMessages] as const;

export class UserPermissionValidator extends BaseValidator<
	typeof validatorMessages
> {
	readonly create = z.object({
		user_id: this.validateId(
			this.getMessage('invalid_id', { name: 'user_id' }),
		),
		permission_ids: z
			.array(
				z
					.number({
						message: this.getMessage('invalid_ids', {
							name: 'ids',
						}),
					})
					.positive(),
			)
			.min(1, {
				message: this.getMessage('array_min', {
					name: 'permission_ids',
					length: '1',
				}),
			}),
	});

	readonly delete = z.object({
		user_id: this.validateId(
			this.getMessage('invalid_id', { name: 'user_id' }),
		),
		permission_id: this.validateId(
			this.getMessage('invalid_id', { name: 'permission_id' }),
		),
	});

	readonly restore = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
		user_id: this.validateId(
			this.getMessage('invalid_id', { name: 'user_id' }),
		),
	});

	readonly find = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: Configuration.get('filter.limit') as number,
		defaultPage: 1,

		filterSchema: {
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

		querySchema: {
			user_id: this.validateId(
				this.getMessage('invalid_id', { name: 'user_id' }),
			),
		},
	});
}

export const userPermissionValidator = new UserPermissionValidator(
	'user-permission',
);
