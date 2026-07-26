import { jest } from '@jest/globals';

import {
	Configuration,
	type SettingsKey,
	type SettingsValue,
} from '@/config/settings.config';

export function mockUuid(): string {
	return '123e4567-e89b-12d3-a456-426614174000';
}

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
