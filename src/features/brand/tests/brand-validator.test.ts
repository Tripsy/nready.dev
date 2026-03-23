import { jest } from '@jest/globals';
import { brandInputPayloads } from '@/features/brand/brand.mock';
import { brandValidator } from '@/features/brand/brand.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof brandValidator,
	'create' | 'update' | 'find' | 'orderUpdate'
>;

const validator = 'BrandValidator';
const listSchemas: ValidatorMethod[] = [
	'create',
	'update',
	'find',
	'orderUpdate',
];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = brandValidator[n];
			const payload = brandInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
