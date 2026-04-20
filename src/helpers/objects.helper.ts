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
		if (
			acc &&
			typeof acc === 'object' &&
			!Array.isArray(acc) &&
			part in acc
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
 * Check if an object has at least one not `undefined` value
 *
 * @param {unknown} obj - The object to check
 * @returns {boolean} - True if the object has at least one not `undefined` value, false otherwise
 */
export function hasAtLeastOneValue(obj: unknown): boolean {
	if (obj === null || obj === undefined) return false;

	if (typeof obj !== 'object') {
		return true;
	}

	// For arrays: treat values like a normal object
	const values = Object.values(obj);

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
