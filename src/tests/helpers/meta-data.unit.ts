import { createRequest } from 'node-mocks-http';
import {
	compareMetaDataValue,
	getMetaDataValue,
	type TokenMetadata,
	tokenMetaData,
} from '@/helpers/meta-data.helper';

jest.mock('@/helpers/system.helper', () => ({
	getClientIp: jest.fn(() => '192.168.1.1'),
}));

describe('helpers/meta-data.helper.ts - Unit Tests', () => {
	describe('getMetaDataValue', () => {
		it('should return the value for an existing key', () => {
			const metadata = { key1: 'value1', key2: 'value2' };

			expect(getMetaDataValue(metadata, 'key1')).toBe('value1');
		});

		it('should return an empty string if the key does not exist', () => {
			const metadata = { key1: 'value1' };

			expect(getMetaDataValue(metadata, 'key2')).toBe('');
		});
	});

	describe('compareMetaDataValue', () => {
		it('should return true if values are the same for the given key', () => {
			const metadata1 = { key: 'value' };
			const metadata2 = { key: 'value' };

			expect(compareMetaDataValue(metadata1, metadata2, 'key')).toBe(
				true,
			);
		});

		it('should return false if values are different for the given key', () => {
			const metadata1 = { key: 'value1' };
			const metadata2 = { key: 'value2' };

			expect(compareMetaDataValue(metadata1, metadata2, 'key')).toBe(
				false,
			);
		});

		it('should return false if key does not exist in one of the metadata objects', () => {
			const metadata1 = { key: 'value' };
			const metadata2 = { otherKey: 'value' };

			expect(compareMetaDataValue(metadata1, metadata2, 'key')).toBe(
				false,
			);
		});

		it('should return true if both metadata objects lack the key', () => {
			const metadata1 = {};
			const metadata2 = {};

			expect(compareMetaDataValue(metadata1, metadata2, 'key')).toBe(
				true,
			);
		});
	});

	describe('tokenMetaData', () => {
		it('should extract metadata correctly from the request', () => {
			const mockRequest = createRequest({
				headers: {
					'user-agent': 'Mozilla/5.0',
					'accept-language': 'en-US,en;q=0.9',
				},
				body: {
					os: 'Windows',
				},
			});

			const expectedMetadata: TokenMetadata = {
				'user-agent': 'Mozilla/5.0',
				'accept-language': 'en-US,en;q=0.9',
				ip: '192.168.1.1',
				os: 'Windows',
			};

			expect(tokenMetaData(mockRequest)).toEqual(expectedMetadata);
		});

		it('should handle missing request body gracefully', () => {
			const mockRequest = createRequest({
				headers: {
					'user-agent': 'Chrome',
				},
			});

			const expectedMetadata: TokenMetadata = {
				'user-agent': 'Chrome',
				'accept-language': '',
				ip: '192.168.1.1',
				os: '',
			};

			expect(tokenMetaData(mockRequest)).toEqual(expectedMetadata);
		});
	});
});
