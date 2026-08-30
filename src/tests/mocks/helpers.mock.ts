import { jest } from '@jest/globals';

import {
	Configuration,
	type SettingsKey,
	type SettingsValue,
} from '@/config/settings.config';

// Re-exported so the tests already importing it from here keep working; it lives apart
// because this file's jest imports must not reach a `<feature>.docs.ts`.
export { mockUuid } from '@/tests/mocks/uuid.mock';

/**
 * Overrides one setting for the duration of a test. The key is checked against the real
 * settings shape, and `value` must match that key's type.
 */
export function mockConfig<K extends SettingsKey>(
	key: K,
	value: SettingsValue<K>,
) {
	const originalGet = Configuration.get;

	jest.spyOn(Configuration, 'get').mockImplementation(((
		configKey: SettingsKey,
	) => {
		if (configKey === key) {
			return value;
		}

		return originalGet(configKey);
	}) as typeof Configuration.get);
}
