import { jest } from '@jest/globals';
import { clientAddressInputPayloads } from '@/features/client-address/client-address.mock';
import { clientAddressValidator } from '@/features/client-address/client-address.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof clientAddressValidator,
	'create' | 'update' | 'find'
>;

const validator = 'ClientAddressValidator';
const listSchemas: ValidatorMethod[] = ['create', 'update', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = clientAddressValidator[n];
			const payload = clientAddressInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
