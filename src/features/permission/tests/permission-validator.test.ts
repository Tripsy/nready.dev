import { jest } from '@jest/globals';
import { permissionInputPayloads } from '@/features/permission/permission.mock';
import { permissionValidator } from '@/features/permission/permission.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof permissionValidator,
	'manage' | 'find'
>;

const validator = 'PermissionValidator';
const listSchemas: ValidatorMethod[] = ['manage', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = permissionValidator[n];
			const payload = permissionInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
