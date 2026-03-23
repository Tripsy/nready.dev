import { jest } from '@jest/globals';
import { categoryInputPayloads } from '@/features/category/category.mock';
import { categoryValidator } from '@/features/category/category.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof categoryValidator,
	'create' | 'update' | 'read' | 'find' | 'statusUpdate'
>;

const validator = 'CategoryValidator';
const listSchemas: ValidatorMethod[] = [
	'create',
	'update',
	'read',
	'find',
	'statusUpdate',
];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = categoryValidator[n];
			const payload = categoryInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
