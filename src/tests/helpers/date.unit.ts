import {
	createCurrentDate,
	createFutureDate,
	createPastDate,
	dateDiff,
	formatDate,
	isValidDate,
} from '@/helpers';

describe('helpers/utils.helper.ts - Unit Tests', () => {
	describe('isValidDate', () => {
		it('should return true for a valid date string', () => {
			const validDateString = '2023-10-01T12:00:00.000Z';

			expect(isValidDate(validDateString)).toBe(true);
		});

		it('should return false for an invalid date string', () => {
			const invalidDateString = 'invalid-date';

			expect(isValidDate(invalidDateString)).toBe(false);
		});
	});

	describe('formatDate', () => {
		it('should throw an error for invalid date', () => {
			const invalidDate = new Date('invalid-date');

			expect(() =>
				formatDate(invalidDate, 'default', {
					strict: true,
				}),
			).toThrow(`Invalid date`);
		});

		it('should convert a Date object to an ISO string', () => {
			const date = new Date('2023-10-01T12:00:00.000Z');

			expect(formatDate(date)).toBe('2023-10-01T12:00:00.000Z');
		});

		it('should convert a Date object to a specific format', () => {
			const date = new Date('2023-10-01T12:00:00.000Z');

			expect(
				formatDate(date, undefined, {
					customFormat: 'YYYY-MM-DD',
				}),
			).toBe('2023-10-01');
		});
	});

	describe('createFutureDate', () => {
		it('should create a future date by adding seconds to the current date', () => {
			const seconds = 60;
			const futureDate = createFutureDate(seconds);

			const expectedTime = createCurrentDate().getTime() + seconds * 1000;

			expect(futureDate.getTime()).toBe(expectedTime);
		});

		it('should throw an error if seconds is a negative number', () => {
			const seconds = -60;

			expect(() => createFutureDate(seconds)).toThrow(
				'Seconds should a positive number greater than 0',
			);
		});
	});

	describe('createPastDate', () => {
		it('should create a past date by subtracting seconds from the current date', () => {
			const seconds = 60;
			const pastDate = createPastDate(seconds);

			const expectedTime = createCurrentDate().getTime() - seconds * 1000;

			expect(pastDate.getTime()).toBe(expectedTime);
		});

		it('should throw an error if seconds is a negative number', () => {
			const seconds = -60;

			expect(() => createPastDate(seconds)).toThrow(
				'Seconds should a positive number greater than 0',
			);
		});
	});

	describe('dateDiff', () => {
		it('should calculate the difference between two dates in seconds', () => {
			const date1 = new Date('2023-10-01T12:00:00.000Z');
			const date2 = new Date('2023-10-01T12:00:30Z');

			expect(dateDiff(date1, date2, 'seconds')).toBe(-30); // date1 is earlier than date2
		});

		it('should handle the same date and return 0', () => {
			const date1 = new Date('2023-10-01T12:00:00.000Z');
			const date2 = new Date('2023-10-01T12:00:00.000Z');

			expect(dateDiff(date1, date2, 'seconds')).toBe(0);
		});

		it('should throw an error for invalid date1', () => {
			const date1 = new Date('invalid-date');
			const date2 = new Date('2023-10-01T12:00:00.000Z');

			expect(() => dateDiff(date1, date2, 'seconds')).toThrow(
				'Invalid date arguments provided for dateDiff',
			);
		});
	});
});
