import dayjs from '@/config/dayjs.config';

/**
 * Check if a string is a valid date
 *
 * @param {string} date - The date string to check
 * @returns {boolean} - True if the date is valid, false otherwise
 */
export function isValidDate(date: string): boolean {
	return dayjs(date).isValid();
}

/**
 * Checks if a value is a valid Date object
 * @param date - The value to check
 * @returns `true` if the value is a valid Date object, `false` otherwise
 */
export function isValidDateInstance(date: unknown): date is Date {
	return (
		date instanceof Date &&
		!Number.isNaN(date.getTime()) &&
		date.toString() !== 'Invalid Date'
	);
}

/**
 * Converts a date string to a Date object with strict validation
 *
 * @param {string | null} value - The date string to convert (ISO 8601, RFC 2822, or other supported formats)
 * @returns {Date | null}
 * @throws {Error} If the input is not a valid date string or cannot be parsed
 */
export function stringToDate(value: string | null): Date | null {
	if (!value) {
		return null;
	}

	const trimmedString = value.trim();

	if (!trimmedString) {
		return null;
	}

	// Special handling for ISO 8601 date-only format (YYYY-MM-DD)
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedString)) {
		const [year, month, day] = trimmedString.split('-').map(Number);
		const date = new Date(Date.UTC(year, month - 1, day));

		if (!isValidDateInstance(date)) {
			throw new Error(`Invalid ISO date: ${trimmedString}`);
		}

		return date;
	}

	// General date parsing
	const parsedDate = new Date(trimmedString);

	if (!isValidDateInstance(parsedDate)) {
		throw new Error(`Invalid date format: ${trimmedString}`);
	}

	// Additional validation for non-ISO formats
	if (parsedDate.toString() === 'Invalid Date') {
		throw new Error(`Unparsable date: ${trimmedString}`);
	}

	return parsedDate;
}

/**
 * Create a current date
 *
 * @returns {Date} - The current date
 */
export function createCurrentDate(): Date {
	return new Date();
}

/**
 * Create a future date by adding seconds to the current date
 *
 * @param {number} seconds - The number of seconds to add
 * @returns {Date} - The future date
 * @throws {Error} - If seconds is a negative number
 */
export function createFutureDate(seconds: number): Date {
	if (seconds <= 0) {
		throw new Error('Seconds should a positive number greater than 0');
	}

	const currentDate = new Date();

	return new Date(currentDate.getTime() + seconds * 1000);
}

/**
 * Create a past date by subtracting seconds from the current date
 *
 * @param {number} seconds - The number of seconds to subtract
 * @returns {Date} - The past date
 * @throws {Error} - If seconds is a negative number
 */
export function createPastDate(seconds: number): Date {
	if (seconds <= 0) {
		throw new Error('Seconds should a positive number greater than 0');
	}

	const currentDate = new Date();

	return new Date(currentDate.getTime() - seconds * 1000);
}

/**
 * Calculate the difference between two dates in seconds
 *
 * @param {Date} date1 - The first date
 * @param {Date} date2 - The second date
 * @returns {number} - The difference in seconds
 * @throws {Error} - If either date is invalid
 */
export function dateDiffInSeconds(date1: Date, date2: Date): number {
	if (!isValidDateInstance(date1)) {
		throw new Error('Invalid date (eg: date1)');
	}

	if (!isValidDateInstance(date2)) {
		throw new Error('Invalid date (eg: date2)');
	}

	return Math.ceil((date1.getTime() - date2.getTime()) / 1000);
}

/**
 * Return the `date` if it is a valid `Date` instance, otherwise return `undefined`.
 *
 * @param date
 */
export function getValidDate(date: unknown): Date | undefined {
	return isValidDateInstance(date) ? date : undefined;
}

/**
 * Universal date formatter with Moment.js
 *
 * @param value - Date input (string, Date, null, undefined)
 * @param format - Output format (or preset)
 * @param options - { strict: boolean }
 * @returns Formatted string or null
 */
export function formatDate(
	value: string | number | Date | null | undefined,
	format?: 'default' | 'date-time' | string,
	options?: {
		strict?: boolean;
	},
): string | undefined {
	// Handle empty values
	if (
		value === null ||
		value === undefined ||
		(typeof value === 'string' && value.trim() === '')
	) {
		if (options?.strict) {
			throw new Error('Invalid date: null/undefined');
		}

		return undefined;
	}

	const date = dayjs(value);

	// Validate date
	if (!date.isValid()) {
		if (options?.strict) {
			throw new Error(`Invalid date: ${value}`);
		}

		return undefined;
	}

	// Apply formatting
	switch (format) {
		case 'default':
			return date.format('YYYY-MM-DD');
		case 'date-time':
			return date.format('DD-MM-YYYY, hh:mm A');
		default:
			if (format) {
				return date.format(format);
			}

			return date.toISOString();
	}
}

/**
 * Combine a date with specified time
 *
 * @param date
 * @param time
 * @param timezone
 */
export function combineDateAndTime(
	date: Date,
	time: string,
	timezone?: string,
): Date {
	const parts = time.split(':').map(Number);
	const hours = parts[0];
	const minutes = parts[1];

	if (Number.isNaN(hours) || Number.isNaN(minutes)) {
		throw new Error(`Invalid time format: "${time}". Expected "HH:MM".`);
	}

	if (timezone) {
		const dateStr = dayjs(date).format('YYYY-MM-DD');
		const combinedStr = `${dateStr} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

		return dayjs.tz(combinedStr, timezone).utc().toDate();
	}

	const result = new Date(date);
	result.setHours(hours, minutes, 0, 0);

	return result;
}
