import { jest } from '@jest/globals';
import { templateInputPayloads } from '@/features/template/template.mock';
import { templateValidator } from '@/features/template/template.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof templateValidator,
	'create' | 'update' | 'find'
>;

const validator = 'TemplateValidator';
const listSchemas: ValidatorMethod[] = ['create', 'update', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = templateValidator[n];
			const payload = templateInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
