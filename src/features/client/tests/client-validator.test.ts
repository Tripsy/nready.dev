import { clientInputPayloads } from '@/features/client/client.mock';
import { clientValidator } from '@/features/client/client.validator';
import { withDebugValidated } from '@/tests/jest-validator.setup';

type ValidatorMethod = keyof Pick<
	typeof clientValidator,
	'create' | 'update' | 'find'
>;

const validator = 'ClientValidator';
const listSchemas: ValidatorMethod[] = ['create', 'update', 'find'];

describe(validator, () => {
	listSchemas.forEach((n) => {
		it(`${n}() accepts valid payload`, async () => {
			const schema = clientValidator[n]();
			const payload = clientInputPayloads.get(n);
			const validated = await schema.safeParseAsync(payload);

			withDebugValidated(() => {
				expect(validated.success).toBe(true);
			}, validated);
		});
	});
});
