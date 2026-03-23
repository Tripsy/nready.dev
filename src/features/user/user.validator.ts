import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	UserOperatorTypeEnum,
	UserStatusEnum,
} from '@/features/user/user.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';
import { UserRoleEnum } from '@/shared/types/user-role.type';

export const paramsUpdateList: string[] = [
	'name',
	'email',
	'password',
	'language',
	'role',
	'operator_type',
];

export enum OrderByEnum {
	ID = 'id',
	NAME = 'name',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

const validatorMessages = {
	invalid_name: lang('user.validation.invalid_name'),
	name_min: lang('user.validation.name_min'),
	invalid_email: lang('user.validation.invalid_email'),
	invalid_password: lang('user.validation.invalid_password'),
	password_min: lang('user.validation.password_min'),
	password_condition_capital_letter: lang(
		'user.validation.password_condition_capital_letter',
	),
	password_condition_number: lang(
		'user.validation.password_condition_number',
	),
	password_condition_special_character: lang(
		'user.validation.password_condition_special_character',
	),
	password_confirm_mismatch: lang(
		'user.validation.password_confirm_mismatch',
	),
	password_confirm_required: lang(
		'user.validation.password_confirm_required',
	),
	invalid_language: lang('shared.validation.invalid_language'),
	invalid_role: lang('user.validation.invalid_role'),
	invalid_status: lang('user.validation.invalid_status'),
	invalid_operator_type: lang('user.validation.invalid_operator_type'),
	operator_type_required: lang('user.validation.operator_type_required'),
	operator_type_only_for_operator: lang(
		'user.validation.operator_type_only_for_operator',
	),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
	invalid_date: lang('shared.validation.invalid_date'),
	invalid_date_format: lang('shared.validation.invalid_date_format'),
	invalid_past_date: lang('shared.validation.invalid_past_date'),
	invalid_future_date: lang('shared.validation.invalid_future_date'),
	invalid_date_range: lang('shared.validation.invalid_date_range'),
};

type UserValidatorMessages = typeof validatorMessages;

export class UserValidator extends BaseValidator<UserValidatorMessages> {
	readonly create = z
		.object({
			name: this.validateString(
				{
					invalid: this.useMessage('invalid_name'),
					min_chars: this.useMessage('name_min'),
				},
				{
					minChars: Configuration.get('user.nameMinChars') as number,
				},
			),
			email: this.validateEmail(this.useMessage('invalid_email')),
			password: this.validatePassword(
				{
					invalid_password: this.useMessage('invalid_password'),
					password_min: this.useMessage('password_min'),
					password_condition_capital_letter: this.useMessage(
						'password_condition_capital_letter',
					),
					password_condition_number: this.useMessage(
						'password_condition_number',
					),
					password_condition_special_character: this.useMessage(
						'password_condition_special_character',
					),
				},
				{
					minLength: Configuration.get(
						'user.passwordMinChars',
					) as number,
				},
			),
			password_confirm: this.validateString(
				this.useMessage('password_confirm_required'),
			),
			language: this.validateLanguage(
				this.useMessage('invalid_language'),
				{
					required: false,
				},
			),
			status: this.validateEnum(
				UserStatusEnum,
				this.useMessage('invalid_status'),
				{ required: false },
			).default(UserStatusEnum.PENDING),
			role: this.validateEnum(
				UserRoleEnum,
				this.useMessage('invalid_role'),
				{ required: false },
			).default(UserRoleEnum.MEMBER),
			operator_type: this.validateEnum(
				UserOperatorTypeEnum,
				this.useMessage('invalid_operator_type'),
				{ required: false },
			),
		})
		.superRefine(({ password, password_confirm }, ctx) => {
			if (password !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: this.useMessage('password_confirm_mismatch'),
					code: 'custom',
				});
			}
		})
		.superRefine(({ role, operator_type }, ctx) => {
			if (role === UserRoleEnum.OPERATOR && !operator_type) {
				ctx.addIssue({
					path: ['operator_type'],
					message: this.useMessage('operator_type_required'),
					code: 'custom',
				});
			}

			if (role !== UserRoleEnum.OPERATOR && operator_type) {
				ctx.addIssue({
					path: ['operator_type'],
					message: this.useMessage('operator_type_only_for_operator'),
					code: 'custom',
				});
			}
		});

	readonly update = z
		.object({
			name: this.validateString(
				{
					invalid: this.useMessage('invalid_name'),
					min_chars: this.useMessage('name_min'),
				},
				{
					required: false,
					minChars: Configuration.get('user.nameMinChars') as number,
				},
			),
			email: this.validateEmail(this.useMessage('invalid_email'), {
				required: false,
			}),
			password: this.validatePassword(
				{
					invalid_password: this.useMessage('invalid_password'),
					password_min: this.useMessage('password_min'),
					password_condition_capital_letter: this.useMessage(
						'password_condition_capital_letter',
					),
					password_condition_number: this.useMessage(
						'password_condition_number',
					),
					password_condition_special_character: this.useMessage(
						'password_condition_special_character',
					),
				},
				{
					required: false,
					minLength: Configuration.get(
						'user.passwordMinChars',
					) as number,
				},
			),
			password_confirm: this.validateString(
				this.useMessage('password_confirm_required'),
				{ required: false },
			),
			language: this.validateLanguage(
				this.useMessage('invalid_language'),
				{
					required: false,
				},
			),
			status: this.validateEnum(
				UserStatusEnum,
				this.useMessage('invalid_status'),
				{ required: false },
			),
			role: this.validateEnum(
				UserRoleEnum,
				this.useMessage('invalid_role'),
				{ required: false },
			),
			operator_type: this.validateEnum(
				UserOperatorTypeEnum,
				this.useMessage('invalid_operator_type'),
				{ required: false },
			),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: lang('shared.validation.params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		})
		.superRefine(({ password, password_confirm }, ctx) => {
			if (password !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: this.useMessage('password_confirm_mismatch'),
					code: 'custom',
				});
			}
		})
		.superRefine(({ role, operator_type }, ctx) => {
			// If the role is being set to OPERATOR, operator_type must be provided
			if (
				role === UserRoleEnum.OPERATOR &&
				(operator_type === null || operator_type === undefined)
			) {
				ctx.addIssue({
					path: ['operator_type'],
					message: this.useMessage('operator_type_required'),
					code: 'custom',
				});
			}

			// If the role is being set to something other than OPERATOR, operator_type must be null
			if (
				role &&
				role !== UserRoleEnum.OPERATOR &&
				operator_type !== null &&
				operator_type !== undefined
			) {
				ctx.addIssue({
					path: ['operator_type'],
					message: this.useMessage('operator_type_only_for_operator'),
					code: 'custom',
				});
			}
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
			term: this.validateString(this.useMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			status: this.validateEnum(
				UserStatusEnum,
				this.useMessage('invalid_status'),
				{ required: false },
			),
			role: this.validateEnum(
				UserRoleEnum,
				this.useMessage('invalid_role'),
				{ required: false },
			),
			create_date_start: this.validateDate(
				{
					invalid_date: this.useMessage('invalid_date'),
					invalid_date_format: this.useMessage('invalid_date_format'),
					invalid_past_date: this.useMessage('invalid_past_date'),
					invalid_future_date: this.useMessage('invalid_future_date'),
				},
				{ required: false },
			),
			create_date_end: this.validateDate(
				{
					invalid_date: this.useMessage('invalid_date'),
					invalid_date_format: this.useMessage('invalid_date_format'),
					invalid_past_date: this.useMessage('invalid_past_date'),
					invalid_future_date: this.useMessage('invalid_future_date'),
				},
				{ required: false },
			),
			is_deleted: this.validateBoolean(
				this.useMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	}).superRefine((data, ctx) => {
		if (
			data.filter.create_date_start &&
			data.filter.create_date_end &&
			data.filter.create_date_start > data.filter.create_date_end
		) {
			ctx.addIssue({
				path: ['filter', 'create_date_start'],
				message: this.useMessage('invalid_date_range'),
				code: 'custom',
			});
		}
	});
}

export const userValidator = new UserValidator(validatorMessages);
