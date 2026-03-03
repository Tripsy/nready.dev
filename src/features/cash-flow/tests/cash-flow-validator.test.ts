import { jest } from '@jest/globals';
import { cashFlowInputPayloads } from '@/features/cash-flow/cash-flow.mock';
import { cashFlowValidator } from '@/features/cash-flow/cash-flow.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof cashFlowValidator,
	'create' | 'update' | 'delete' | 'find'
>;

const validator = 'CashFlowValidator';
const listSchemas: ValidatorMethod[] = ['create', 'update', 'delete', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = cashFlowValidator[n]();
			const payload = cashFlowInputPayloads.get(n);
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
