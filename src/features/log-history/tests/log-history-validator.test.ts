import { jest } from '@jest/globals';
import { cronHistoryInputPayloads } from '@/features/cron-history/cron-history.mock';
import { cronHistoryValidator } from '@/features/cron-history/cron-history.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<typeof cronHistoryValidator, 'find'>;

const validator = 'CronHistoryValidator';
const listSchemas: ValidatorMethod[] = ['find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = cronHistoryValidator[n];
			const payload = cronHistoryInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
