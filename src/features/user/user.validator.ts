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

export class UserValidator extends BaseValidator {
	private readonly nameMinLength = Configuration.get(
		'user.nameMinLength',
	) as number;
	private readonly passwordMinLength = Configuration.get(
		'user.passwordMinLength',
	) as number;
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	public create() {
		return z
			.object({
				name: this.validateStringMin(
					lang('user.validation.name_invalid'),
					this.nameMinLength,
					lang('user.validation.name_min', {
						min: this.nameMinLength.toString(),
					}),
				),
				email: z.email({
					message: lang('user.validation.email_invalid'),
				}),
				password: z
					.string({
						message: lang('user.validation.password_invalid'),
					})
					.min(this.passwordMinLength, {
						message: lang('user.validation.password_min', {
							min: this.passwordMinLength.toString(),
						}),
					})
					.refine((value) => /[A-Z]/.test(value), {
						message: lang(
							'user.validation.password_condition_capital_letter',
						),
					})
					.refine((value) => /[0-9]/.test(value), {
						message: lang(
							'user.validation.password_condition_number',
						),
					})
					.refine(
						(value) =>
							/[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value),
						{
							message: lang(
								'user.validation.password_condition_special_character',
							),
						},
					),
				password_confirm: z.string({
					message: lang('user.validation.password_confirm_required'),
				}),
				language: this.validateLanguage().optional(),
				status: z
					.enum(UserStatusEnum)
					.optional()
					.default(UserStatusEnum.PENDING),
				role: z
					.enum(UserRoleEnum)
					.optional()
					.default(UserRoleEnum.MEMBER),
				operator_type: z
					.enum(UserOperatorTypeEnum)
					.nullable()
					.optional(),
			})
			.superRefine(({ password, password_confirm }, ctx) => {
				if (password !== password_confirm) {
					ctx.addIssue({
						path: ['password_confirm'],
						message: lang(
							'user.validation.password_confirm_mismatch',
						),
						code: 'custom',
					});
				}
			})
			.superRefine(({ role, operator_type }, ctx) => {
				if (role === UserRoleEnum.OPERATOR && !operator_type) {
					ctx.addIssue({
						path: ['operator_type'],
						message: lang('user.validation.operator_type_required'),
						code: 'custom',
					});
				}

				if (role !== UserRoleEnum.OPERATOR && operator_type) {
					ctx.addIssue({
						path: ['operator_type'],
						message: lang(
							'user.validation.operator_type_only_for_operator',
						),
						code: 'custom',
					});
				}
			});
	}

	public update() {
		return z
			.object({
				name: this.validateStringMin(
					lang('user.validation.name_invalid'),
					this.nameMinLength,
					lang('user.validation.name_min', {
						min: this.nameMinLength.toString(),
					}),
				).optional(),
				email: z
					.email({ message: lang('user.validation.email_invalid') })
					.optional(),
				password: z
					.string({
						message: lang('user.validation.password_invalid'),
					})
					.min(this.passwordMinLength, {
						message: lang('user.validation.password_min', {
							min: this.passwordMinLength.toString(),
						}),
					})
					.refine((value) => /[A-Z]/.test(value), {
						message: lang(
							'user.validation.password_condition_capital_letter',
						),
					})
					.refine((value) => /[0-9]/.test(value), {
						message: lang(
							'user.validation.password_condition_number',
						),
					})
					.refine(
						(value) =>
							/[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value),
						{
							message: lang(
								'user.validation.password_condition_special_character',
							),
						},
					)
					.optional(),
				password_confirm: this.validateString(
					lang('user.validation.password_confirm_required'),
				).optional(),
				language: this.validateLanguage().optional(),
				role: z.enum(UserRoleEnum).optional(),
				operator_type: z
					.enum(UserOperatorTypeEnum)
					.nullable()
					.optional(),
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
						message: lang(
							'user.validation.password_confirm_mismatch',
						),
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
						message: lang('user.validation.operator_type_required'),
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
						message: lang(
							'user.validation.operator_type_only_for_operator',
						),
						code: 'custom',
					});
				}
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
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.optional(),
				status: z.enum(UserStatusEnum).optional(),
				role: z.enum(UserRoleEnum).optional(),
				create_date_start: this.validateDate(),
				create_date_end: this.validateDate(),
				is_deleted: this.validateBoolean().default(false),
			},
		}).superRefine((data, ctx) => {
			if (
				data.filter.create_date_start &&
				data.filter.create_date_end &&
				data.filter.create_date_start > data.filter.create_date_end
			) {
				ctx.addIssue({
					path: ['filter', 'create_date_start'],
					message: lang('shared.validation.invalid_date_range'),
					code: 'custom',
				});
			}
		});
	}
}

export const userValidator = new UserValidator();
