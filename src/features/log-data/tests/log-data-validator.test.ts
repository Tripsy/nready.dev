import { jest } from '@jest/globals';
import { logDataInputPayloads } from '@/features/log-data/log-data.mock';
import { logDataValidator } from '@/features/log-data/log-data.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<typeof logDataValidator, 'find'>;

const validator = 'LogDataValidator';
const listSchemas: ValidatorMethod[] = ['find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = logDataValidator[n];
			const payload = logDataInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
