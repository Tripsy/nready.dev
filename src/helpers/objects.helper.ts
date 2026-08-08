export type ObjectValue =
	| string
	| number
	| boolean
	| Date
	| RegExp
	| null
	| undefined
	| ObjectValue[]
	| { [key: string]: ObjectValue };

/**
 * Get the value of a key in an object
 * ex: key = "user.create"
 *
 * @param {Record<string, any>} obj - The object to get the value from
 * @param {string} key - The key to get the value of
 * @returns {any} - The value of the key
 */
export function getObjectValue(
	obj: { [key: string]: ObjectValue },
	key: string,
): ObjectValue | undefined {
	return key.split('.').reduce<ObjectValue | undefined>((acc, part) => {
		// `Object.hasOwn` rather than `in`: `in` walks the prototype chain, so a path segment
		// like `constructor` or `toString` would resolve to a built-in instead of missing.
		if (
			acc &&
			typeof acc === 'object' &&
			!Array.isArray(acc) &&
			Object.hasOwn(acc, part)
		) {
			return (acc as { [key: string]: ObjectValue })[part];
		}
		return undefined;
	}, obj);
}

/**
 * Set the value of a key in an object
 * ex: key = "user.create", value = "new value"
 *
 * @param {Record<string, any>} obj - The object to set the value in
 * @param {string} key - The key to set the value for
 * @param {ObjectValue} value - The value to set
 * @returns {boolean} - Whether the value was successfully set
 */
export function setObjectValue(
	obj: { [key: string]: ObjectValue },
	key: string,
	value: ObjectValue,
): boolean {
	const parts = key.split('.');
	const lastPart = parts.pop();

	if (!lastPart) {
		return false;
	}

	const parent = parts.reduce<ObjectValue | undefined>((acc, part) => {
		if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
			if (!(part in acc)) {
				(acc as { [key: string]: ObjectValue })[part] = {};
			}
			return (acc as { [key: string]: ObjectValue })[part];
		}
		return undefined;
	}, obj);

	if (parent && typeof parent === 'object' && !Array.isArray(parent)) {
		(parent as { [key: string]: ObjectValue })[lastPart] = value;
		return true;
	}

	return false;
}

/**
 * A plain `{}` or an object with a null prototype — something whose contents live in its own
 * enumerable properties. A `Date`, `RegExp` or class instance is not: its value is internal
 * state, so `Object.values()` on one returns `[]`.
 */
function isPlainObject(value: object): boolean {
	const prototype = Object.getPrototypeOf(value);

	return prototype === Object.prototype || prototype === null;
}

/**
 * Check if an object has at least one not `undefined` value.
 *
 * @param {unknown} obj - The object to check
 * @param {readonly string[]} keys - Restrict the check to these properties. Update schemas pass
 *   their `paramsUpdateList`: the controller merges the path `id` into the payload before
 *   validating, and counting that would make every update look non-empty — including one whose
 *   body was empty, which is precisely what the check exists to reject.
 * @returns {boolean} - True if the object has at least one not `undefined` value, false otherwise
 */
export function hasAtLeastOneValue(
	obj: unknown,
	keys?: readonly string[],
): boolean {
	if (obj === null || obj === undefined) return false;

	if (typeof obj !== 'object') {
		return true;
	}

	/*
	 * A `Date` or `RegExp` is a value, not a container to look inside — recursing would find no
	 * enumerable properties and report it as empty. This matters wherever the only updatable
	 * fields are dates (`work-session` accepts `start_at`/`end_at` and nothing else): such a
	 * payload has to count as sent, not as empty.
	 */
	if (!Array.isArray(obj) && !isPlainObject(obj)) {
		return true;
	}

	const record = obj as Record<string, unknown>;

	// Arrays are treated like any other object; only the top-level call narrows by `keys`,
	// because a nested object should be examined in full.
	const values = keys
		? keys.map((key) => record[key])
		: Object.values(record);

	// No keys → empty
	if (values.length === 0) {
		return false;
	}

	// Check children
	return values.some((v) => hasAtLeastOneValue(v));
}

/**
 * Determine if value is included in array
 *
 * @param value
 * @param array
 */
export function arrayHasValue<T extends readonly unknown[]>(
	value: unknown,
	array: T,
): value is T[number] {
	return array.includes(value);
}

/**
 * Creates a new object with only the specified keys from the source
 */
export function pickValuesFromObject<T extends Record<string, unknown>>(
	source: T,
	keys: string[],
): Partial<T> {
	return keys.reduce(
		(acc, key) => {
			if (key in source) {
				acc[key as keyof T] = source[key as keyof T];
			}

			return acc;
		},
		{} as Partial<T>,
	);
}
