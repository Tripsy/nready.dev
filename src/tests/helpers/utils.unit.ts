import { replaceVars } from '@/helpers/string.helper';
import { isValidIp } from '@/helpers/system.helper';

describe('helpers/utils.helper.ts - Unit Tests', () => {
	describe('isValidIp', () => {
		test('should return true for valid IPv4 addresses', () => {
			expect(isValidIp('192.168.1.1')).toBe(true);
			expect(isValidIp('10.0.0.1')).toBe(true);
			expect(isValidIp('172.16.0.1')).toBe(true);
			expect(isValidIp('255.255.255.255')).toBe(true);
			expect(isValidIp('0.0.0.0')).toBe(true);
		});

		test('should return false for invalid IPv4 addresses', () => {
			expect(isValidIp('256.256.256.256')).toBe(false); // Out of range
			expect(isValidIp('192.168.1.999')).toBe(false); // Out of range
			expect(isValidIp('192.168.1')).toBe(false); // Incomplete
			expect(isValidIp('192.168.1.1.1')).toBe(false); // Too many octets
			expect(isValidIp('abc.def.gha.bcd')).toBe(false); // Non-numeric
		});

		test('should return true for valid IPv6 addresses', () => {
			expect(isValidIp('2001:db8::ff00:42:8329')).toBe(true);
			expect(isValidIp('::1')).toBe(true);
			expect(isValidIp('fe80::1')).toBe(true);
			expect(isValidIp('::')).toBe(true);
			expect(isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(
				true,
			);
		});

		test('should return false for invalid IPv6 addresses', () => {
			expect(isValidIp('2001:db8:::ff00:42:8329')).toBe(false); // Extra colon
			expect(isValidIp('gggg::ffff')).toBe(false); // Invalid hex characters
			expect(isValidIp('12345::6789')).toBe(false); // Too many characters in a section
			expect(isValidIp('1.1.1.1.1')).toBe(false); // Looks like IPv4 but wrong format
		});

		test('should return false for random non-IP strings', () => {
			expect(isValidIp('hello world')).toBe(false);
			expect(isValidIp('not.an.ip')).toBe(false);
			expect(isValidIp('192.168.abc.def')).toBe(false);
		});
	});

	describe('replaceVars', () => {
		it('should replace template variables with provided values', () => {
			const content = 'Hello, {{name}}! Welcome to {{place}}.';
			const vars = { name: 'John', place: 'Earth' };

			expect(replaceVars(content, vars)).toBe(
				'Hello, John! Welcome to Earth.',
			);
		});

		it('should leave unmatched template variables unchanged', () => {
			const content = 'Hello, {{name}}! Welcome to {{place}}.';
			const vars = { name: 'John' }; // 'place' is missing

			expect(replaceVars(content, vars)).toBe(
				'Hello, John! Welcome to {{place}}.',
			);
		});

		it('should leave all template variables unchanged if no variables are provided', () => {
			const content = 'Hello, {{name}}! Welcome to {{place}}.';

			expect(replaceVars(content)).toBe(
				'Hello, {{name}}! Welcome to {{place}}.',
			);
		});
	});
});
