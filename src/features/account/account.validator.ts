import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

const validatorMessages = {
	invalid_name: lang('account.validation.invalid_name'),
	name_min: lang('account.validation.name_min', {
		min: Configuration.get('user.nameMinChars') as string,
	}),
	invalid_email: lang('account.validation.invalid_email'),
	invalid_password: lang('account.validation.invalid_password'),
	password_min: lang('account.validation.password_min', {
		min: Configuration.get('user.passwordMinChars') as string,
	}),
	password_condition_capital_letter: lang(
		'account.validation.password_condition_capital_letter',
	),
	password_condition_number: lang(
		'account.validation.password_condition_number',
	),
	password_condition_special_character: lang(
		'account.validation.password_condition_special_character',
	),
	password_confirm_required: lang(
		'account.validation.password_confirm_required',
	),
	password_confirm_mismatch: lang(
		'account.validation.password_confirm_mismatch',
	),
	invalid_language: lang('account.validation.invalid_language'),
	invalid_password_current: lang(
		'account.validation.invalid_password_current',
	),
	invalid_ident: lang('account.validation.invalid_ident'),
};

export class AccountValidator extends BaseValidator<typeof validatorMessages> {
	readonly register = z
		.object({
			name: this.validateString(
				{
					invalid: this.getMessage('invalid_name'),
					min_chars: this.getMessage('name_min'),
				},
				{
					required: true,
					minChars: Configuration.get('user.nameMinChars') as number,
				},
			),
			email: this.validateEmail(this.getMessage('invalid_email')),
			password: this.validatePassword(
				{
					invalid_password: this.getMessage('invalid_password'),
					password_min: this.getMessage('password_min'),
					password_condition_capital_letter: this.getMessage(
						'password_condition_capital_letter',
					),
					password_condition_number: this.getMessage(
						'password_condition_number',
					),
					password_condition_special_character: this.getMessage(
						'password_condition_special_character',
					),
				},
				{
					required: true,
					minLength: Configuration.get(
						'user.passwordMinChars',
					) as number,
				},
			),
			password_confirm: this.validateString(
				this.getMessage('password_confirm_required'),
			),
			language: this.validateLanguage(
				this.getMessage('invalid_language'),
				{
					required: false,
				},
			),
		})
		.superRefine(({ password, password_confirm }, ctx) => {
			if (password !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: this.getMessage('password_confirm_mismatch'),
					code: 'custom',
				});
			}
		});

	readonly login = z.object({
		email: this.validateEmail(this.getMessage('invalid_email')),
		password: this.validateString(this.getMessage('invalid_password')),
	});

	readonly passwordRecover = z.object({
		email: this.validateEmail(this.getMessage('invalid_email')),
	});

	readonly passwordRecoverChange = z
		.object({
			password: this.validatePassword(
				{
					invalid_password: this.getMessage('invalid_password'),
					password_min: this.getMessage('password_min'),
					password_condition_capital_letter: this.getMessage(
						'password_condition_capital_letter',
					),
					password_condition_number: this.getMessage(
						'password_condition_number',
					),
					password_condition_special_character: this.getMessage(
						'password_condition_special_character',
					),
				},
				{
					required: true,
					minLength: Configuration.get(
						'user.passwordMinChars',
					) as number,
				},
			),
			password_confirm: this.validateString(
				this.getMessage('password_confirm_required'),
			),
		})
		.superRefine(({ password, password_confirm }, ctx) => {
			if (password !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: this.getMessage('password_confirm_mismatch'),
					code: 'custom',
				});
			}
		});

	readonly passwordUpdate = z
		.object({
			password_current: this.validateString(
				this.getMessage('invalid_password_current'),
			),
			password_new: this.validatePassword(
				{
					invalid_password: this.getMessage('invalid_password'),
					password_min: this.getMessage('password_min'),
					password_condition_capital_letter: this.getMessage(
						'password_condition_capital_letter',
					),
					password_condition_number: this.getMessage(
						'password_condition_number',
					),
					password_condition_special_character: this.getMessage(
						'password_condition_special_character',
					),
				},
				{
					required: true,
					minLength: Configuration.get(
						'user.passwordMinChars',
					) as number,
				},
			),
			password_confirm: this.validateString(
				this.getMessage('password_confirm_required'),
			),
		})
		.superRefine(({ password_new, password_confirm }, ctx) => {
			if (password_new !== password_confirm) {
				ctx.addIssue({
					path: ['password_confirm'],
					message: this.getMessage('password_confirm_mismatch'),
					code: 'custom',
				});
			}
		});

	readonly emailConfirmSend = z.object({
		email: this.validateEmail(this.getMessage('invalid_email')),
	});

	readonly emailUpdate = z.object({
		email_new: this.validateEmail(this.getMessage('invalid_email')),
	});

	readonly removeToken = z.object({
		ident: z.uuid({
			message: this.getMessage('invalid_ident'),
		}),
	});

	readonly meEdit = z.object({
		name: this.validateString(
			{
				invalid: this.getMessage('invalid_name'),
				min_chars: this.getMessage('name_min'),
			},
			{
				required: true,
				minChars: Configuration.get('user.nameMinChars') as number,
			},
		),
		language: this.validateLanguage(this.getMessage('invalid_language'), {
			required: false,
		}),
	});

	readonly meDelete = z.object({
		password_current: this.validateString(
			this.getMessage('invalid_password_current'),
		),
	});
}

export const accountValidator = new AccountValidator(validatorMessages);
