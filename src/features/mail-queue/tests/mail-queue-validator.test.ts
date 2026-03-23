import { jest } from '@jest/globals';
import { mailQueueInputPayloads } from '@/features/mail-queue/mail-queue.mock';
import { mailQueueValidator } from '@/features/mail-queue/mail-queue.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<typeof mailQueueValidator, 'find'>;

const validator = 'MailQueueValidator';
const listSchemas: ValidatorMethod[] = ['find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = mailQueueValidator[n];
			const payload = mailQueueInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
