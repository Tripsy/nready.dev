import { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import { AccountIdentityProviderEnum } from '@/features/account/account-identity.entity';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

const validatorMessages = [
	...sharedValidatorMessages,
	'invalid_name',
	'name_min',
	'invalid_email',
	'invalid_password',
	'password_min',
	'password_condition_capital_letter',
	'password_condition_number',
	'password_condition_special_character',
	'password_confirm_mismatch',
	'password_confirm_required',
	'invalid_role',
	'invalid_operator_type',
	'operator_type_required',
	'operator_type_only_for_operator',
	'invalid_ident',
	'invalid_token',
	'invalid_password_current',
	'invalid_oauth_provider',
	'invalid_oauth_code',
	'invalid_oauth_redirect_uri',
] as const;

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
					minChars: Configuration.get('user.nameMinChars'),
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

	/**
	 * `provider` arrives as a route param, `code`/`redirect_uri` in the body — the
	 * controller merges both before validating.
	 */
	readonly oauthLogin = z.object({
		provider: z.enum(AccountIdentityProviderEnum, {
			message: this.getMessage('invalid_oauth_provider'),
		}),
		code: this.validateString(this.getMessage('invalid_oauth_code')),
		redirect_uri: this.validateString(
			this.getMessage('invalid_oauth_redirect_uri'),
		),
		language: this.validateLanguage(this.getMessage('invalid_language'), {
			required: false,
		}),
	});

	readonly oauthUnlink = z.object({
		provider: z.enum(AccountIdentityProviderEnum, {
			message: this.getMessage('invalid_oauth_provider'),
		}),
	});

	readonly passwordRecover = z.object({
		email: this.validateEmail(this.getMessage('invalid_email')),
	});

	readonly passwordRecoverChange = z
		.object({
			ident: z.uuid({
				message: this.getMessage('invalid_ident'),
			}),
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

	readonly emailConfirm = z.object({
		token: this.validateString(this.getMessage('invalid_token')),
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
				minChars: Configuration.get('user.nameMinChars'),
			},
		),
		language: this.validateLanguage(this.getMessage('invalid_language'), {
			required: false,
		}),
	});

	/**
	 * `password_current` is optional at the schema level because a social sign-in account
	 * has none to send. The controller still requires it whenever the account does have a
	 * password — the check needs the user row, which is not available here.
	 */
	readonly meDelete = z.object({
		password_current: this.validateString(
			this.getMessage('invalid_password_current'),
			{ required: false },
		),
	});
}
