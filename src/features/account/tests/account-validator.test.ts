import { jest } from '@jest/globals';
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
});
