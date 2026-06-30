import dayjs from '@/config/dayjs.config';

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Create a current date
 *
 * @param startOfDay - If true, returns the current date at 00:00:00.000
 * @returns {Date} - The current date
 */
export function createCurrentDate(startOfDay: boolean = false): Date {
	const now = new Date();

	if (startOfDay) {
		now.setHours(0, 0, 0, 0);
	}

	return now;
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
 * Check if a string is a valid date
 *
 * @param {string} date - The date string to check
 * @returns {boolean} - True if the date is valid, false otherwise
 */
export function isValidDate(date: string): boolean {
	return dayjs(date).isValid();
}

/**
 * Convert string to Date object using dayjs
 *
 * @param date
 * @param startOfDay
 */
export function stringToDate(date: string, startOfDay: boolean = false): Date {
	const parsed = dayjs(date);

	if (!parsed.isValid()) {
		throw new Error(`Invalid date value: "${date}"`);
	}

	if (startOfDay) {
		return parsed.startOf('day').toDate();
	}

	return parsed.toDate();
}

/**
 * Date formatter with dayjs
 *
 * @param value - Date input (string, Date, null, undefined)
 * @param format - Output format (or preset)
 * @param options - { strict: boolean }
 * @returns Formatted string or null
 */
export function formatDate(
	value: string | number | Date | null | undefined,
	format?: 'default' | 'date-time' | 'time',
	options?: {
		customFormat?: string;
		strict?: boolean;
	},
): string | null {
	// Handle empty values
	if (
		value === null ||
		value === undefined ||
		(typeof value === 'string' && value.trim() === '')
	) {
		if (options?.strict) {
			throw new Error('Invalid date: null/undefined');
		}

		return null;
	}

	const date = dayjs(value);

	// Validate date
	if (!date.isValid()) {
		if (options?.strict) {
			throw new Error(`Invalid date: ${value}`);
		}

		return null;
	}

	switch (format) {
		case 'default':
			return date.format(DEFAULT_DATE_FORMAT);
		case 'date-time':
			return date.format('DD-MM-YYYY, HH:mm');
		case 'time':
			return date.format('HH:mm');
		default:
			if (format) {
				return date.format(format);
			}

			if (options?.customFormat) {
				return date.format(options.customFormat);
			}

			return date.toISOString();
	}
}

/**
 * Calculate the difference between two dates
 *
 * @example
 * dateDiff(start, end, 'minutes') → 90
 * dateDiff(start, end, 'display') → "1h 30'"
 * dateDiff(start, end, 'seconds') → 5400
 */
// Overload signatures
export function dateDiff(
	start: string | Date,
	end: string | Date,
	unit: 'display',
): string;
export function dateDiff(
	start: string | Date,
	end: string | Date,
	unit: 'seconds' | 'minutes' | 'hours',
): number;
// Implementation signature
export function dateDiff(
	startDate: string | Date,
	endDate: string | Date,
	unit: 'seconds' | 'minutes' | 'hours' | 'display',
): number | string {
	const start = dayjs(startDate);
	const end = dayjs(endDate);

	if (!start.isValid() || !end.isValid()) {
		throw new Error('Invalid date arguments provided for dateDiff');
	}

	switch (unit) {
		case 'seconds':
			return Math.ceil(end.diff(start, 'second', true));
		case 'minutes':
			return Math.ceil(end.diff(start, 'minute', true));
		case 'hours':
			return Math.ceil(end.diff(start, 'hour', true));
		case 'display': {
			const diffInMinutes = end.diff(start, 'minute');
			const hours = Math.floor(diffInMinutes / 60);
			const minutes = diffInMinutes % 60;

			return `${hours}h ${minutes}'`;
		}
	}
}
