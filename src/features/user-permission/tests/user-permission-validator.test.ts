import { jest } from '@jest/globals';
import { userPermissionInputPayloads } from '@/features/user-permission/user-permission.mock';
import { userPermissionValidator } from '@/features/user-permission/user-permission.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof userPermissionValidator,
	'create' | 'find'
>;

const validator = 'UserPermissionValidator';
const listSchemas: ValidatorMethod[] = ['create', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = userPermissionValidator[n];
			const payload = userPermissionInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
