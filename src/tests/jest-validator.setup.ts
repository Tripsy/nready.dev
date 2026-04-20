import type { z } from 'zod';

function addDebugValidated(
	validated: z.ZodSafeParseResult<unknown>,
	hint: string,
) {
	console.debug(hint, validated);
}

export function withDebugValidated<T>(
	testFn: () => T,
	validated: z.ZodSafeParseResult<unknown>,
): T {
	try {
		return testFn();
	} catch (error) {
		// Get current test info from Jest
		const testName = expect.getState().currentTestName;

		addDebugValidated(validated, testName ?? '');

		throw error;
	}
}
