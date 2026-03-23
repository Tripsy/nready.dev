import { jest } from '@jest/globals';
import { placeInputPayloads } from '@/features/place/place.mock';
import { placeValidator } from '@/features/place/place.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

type ValidatorMethod = keyof Pick<
	typeof placeValidator,
	'create' | 'update' | 'find'
>;

const validator = 'PlaceValidator';
const listSchemas: ValidatorMethod[] = ['create', 'update', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, () => {
			const schema = placeValidator[n];
			const payload = placeInputPayloads[n];
			const validated = schema.safeParse(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
