import { jest } from '@jest/globals';
import type { z } from 'zod';
import { accountInputPayloads } from '@/features/account/account.mock';
import { AccountValidator } from '@/features/account/account.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	AccountValidator,
	| 'register'
	| 'login'
	| 'passwordRecover'
	| 'passwordRecoverChange'
	| 'passwordUpdate'
	| 'emailConfirmSend'
	| 'emailUpdate'
	| 'removeToken'
	| 'meEdit'
	| 'meDelete'
>;

const validator = 'AccountValidator';
const listSchemas: ValidatorMethod[] = [
	'register',
	'login',
	'passwordRecover',
	'passwordRecoverChange',
	'passwordUpdate',
	'emailConfirmSend',
	'emailUpdate',
	'removeToken',
	'meEdit',
	'meDelete',
];

const accountValidator = new AccountValidator('account');

/**
 * Asserts the payload is rejected with a specific issue.
 *
 * Under `APP_ENV=test` `lang()` returns the key rather than the sentence, so `messageKey`
 * is the full dotted key — which also pins down that the schema is wired to the intended
 * message, not merely that it rejected something.
 */
function expectIssue(
	schema: { safeParse: (data: unknown) => z.ZodSafeParseResult<unknown> },
	payload: unknown,
	path: string,
	messageKey: string,
) {
	const validated = schema.safeParse(payload);

	withDebugValidated(() => {
		expect(validated.success).toBe(false);

		const issue = validated.error?.issues.find(
			(candidate) => candidate.path.join('.') === path,
		);

		expect(issue).toBeDefined();
		expect(issue?.message).toBe(messageKey);
	}, validated);
}

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = accountValidator[n];
			const payload = accountInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});

	describe('password confirmation', () => {
		// The three `superRefine` blocks are the only cross-field rules in this validator
		// and were entirely uncovered — a broken one silently lets a mistyped confirmation
		// through and locks the user out of the account they just changed.
		it('register() rejects a mismatched confirmation', () => {
			expectIssue(
				accountValidator.register,
				{
					...accountInputPayloads.register,
					password_confirm: 'Different@123',
				},
				'password_confirm',
				'account.validation.password_confirm_mismatch',
			);
		});

		it('passwordRecoverChange() rejects a mismatched confirmation', () => {
			expectIssue(
				accountValidator.passwordRecoverChange,
				{
					...accountInputPayloads.passwordRecoverChange,
					password_confirm: 'Different@123',
				},
				'password_confirm',
				'account.validation.password_confirm_mismatch',
			);
		});

		it('passwordUpdate() rejects a mismatched confirmation', () => {
			expectIssue(
				accountValidator.passwordUpdate,
				{
					...accountInputPayloads.passwordUpdate,
					password_confirm: 'Different@123',
				},
				'password_confirm',
				'account.validation.password_confirm_mismatch',
			);
		});

		it('register() accepts a confirmation that matches exactly', () => {
			const validated = accountValidator.register.safeParse({
				...accountInputPayloads.register,
				password: 'Another@456',
				password_confirm: 'Another@456',
			});

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});

	describe('password policy', () => {
		const cases: [string, string, string][] = [
			[
				'shorter than the minimum',
				'Ab@1',
				'account.validation.password_min',
			],
			[
				'missing a capital letter',
				'secure@123',
				'account.validation.password_condition_capital_letter',
			],
			[
				'missing a number',
				'Secure@abc',
				'account.validation.password_condition_number',
			],
			[
				'missing a special character',
				'Secure1234',
				'account.validation.password_condition_special_character',
			],
		];

		cases.forEach(([label, password, messageKey]) => {
			it(`register() rejects a password ${label}`, () => {
				expectIssue(
					accountValidator.register,
					{
						...accountInputPayloads.register,
						password,
						password_confirm: password,
					},
					'password',
					messageKey,
				);
			});
		});
	});

	describe('email', () => {
		const schemas: [string, z.ZodTypeAny, string][] = [
			['register', accountValidator.register, 'email'],
			['login', accountValidator.login, 'email'],
			['passwordRecover', accountValidator.passwordRecover, 'email'],
			['emailConfirmSend', accountValidator.emailConfirmSend, 'email'],
			['emailUpdate', accountValidator.emailUpdate, 'email_new'],
		];

		schemas.forEach(([name, schema, field]) => {
			it(`${name}() rejects a malformed address`, () => {
				expectIssue(
					schema,
					{
						...accountInputPayloads.register,
						[field]: 'not-an-email',
					},
					field,
					'account.validation.invalid_email',
				);
			});
		});
	});

	describe('ident', () => {
		it('passwordRecoverChange() rejects a non-uuid ident', () => {
			expectIssue(
				accountValidator.passwordRecoverChange,
				{
					...accountInputPayloads.passwordRecoverChange,
					ident: 'nope',
				},
				'ident',
				'account.validation.invalid_ident',
			);
		});

		it('removeToken() rejects a non-uuid ident', () => {
			expectIssue(
				accountValidator.removeToken,
				{ ident: '12345' },
				'ident',
				'account.validation.invalid_ident',
			);
		});
	});

	describe('name', () => {
		it('register() rejects a name below the minimum length', () => {
			expectIssue(
				accountValidator.register,
				{ ...accountInputPayloads.register, name: 'Jo' },
				'name',
				'account.validation.name_min',
			);
		});

		it('meEdit() rejects a missing name', () => {
			expectIssue(
				accountValidator.meEdit,
				{ language: 'en' },
				'name',
				'account.validation.invalid_name',
			);
		});
	});

	describe('language', () => {
		it('meEdit() rejects a language that is not a 2-letter code', () => {
			expectIssue(
				accountValidator.meEdit,
				{ ...accountInputPayloads.meEdit, language: 'eng' },
				'language',
				'shared.validation.invalid_language',
			);
		});

		it('meEdit() accepts an omitted language', () => {
			const validated = accountValidator.meEdit.safeParse({
				name: 'John Doe',
			});

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});

	describe('emailConfirm', () => {
		// Not part of `listSchemas` above, so it had no coverage at all.
		it('accepts a token', () => {
			const validated = accountValidator.emailConfirm.safeParse({
				token: 'some-token-value',
			});

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});

		it('rejects a missing token', () => {
			expectIssue(
				accountValidator.emailConfirm,
				{},
				'token',
				'account.validation.invalid_token',
			);
		});
	});
});
