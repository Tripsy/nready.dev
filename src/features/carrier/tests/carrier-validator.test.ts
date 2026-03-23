import { jest } from '@jest/globals';
import { carrierInputPayloads } from '@/features/carrier/carrier.mock';
import { carrierValidator } from '@/features/carrier/carrier.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof carrierValidator,
	'create' | 'update' | 'find'
>;

const validator = 'CarrierValidator';
const listSchemas: ValidatorMethod[] = ['create', 'update', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = carrierValidator[n];
			const payload = carrierInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
