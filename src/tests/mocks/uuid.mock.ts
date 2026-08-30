/**
 * A fixed uuid for fixtures.
 *
 * Kept apart from `helpers.mock.ts` because that file imports `@jest/globals`, a
 * devDependency. `<feature>.docs.ts` files import `<feature>.mock.ts` for their samples and
 * the production build follows that import graph, so a mock a docs file reaches must pull in
 * nothing that only exists in development — the documentation loader treats a failed import
 * as an undocumented feature and skips it without a word.
 */
export function mockUuid(): string {
	return '123e4567-e89b-12d3-a456-426614174000';
}
