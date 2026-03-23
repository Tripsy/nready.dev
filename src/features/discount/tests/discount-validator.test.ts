import { jest } from '@jest/globals';
import { discountInputPayloads } from '@/features/discount/discount.mock';
import { discountValidator } from '@/features/discount/discount.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof discountValidator,
	'create' | 'update' | 'find'
>;

const validator = 'DiscountValidator';
const listSchemas: ValidatorMethod[] = ['create', 'update', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = discountValidator[n];
			const payload = discountInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
