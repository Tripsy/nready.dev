import { expect, jest } from '@jest/globals';
import type { EntityManager } from 'typeorm';
import type DocumentSeriesEntity from '@/features/document-series/document-series.entity';
import { DocumentTypeEnum } from '@/features/document-series/document-series.entity';
import { getDocumentSeriesEntityMock } from '@/features/document-series/document-series.mock';
import type { DocumentSeriesQuery } from '@/features/document-series/document-series.repository';
import {
	createMockQuery,
	createMockRepository,
} from '@/tests/jest-service.setup';

const mockDocumentSeries = createMockRepository<
	DocumentSeriesEntity,
	DocumentSeriesQuery
>();

/*
 * Allocation is the one path that does not run through the service's own repository: it builds a
 * query against the caller's `EntityManager` so the counter moves inside that transaction. Both
 * factories are therefore mocked here, and the manager is stubbed per test.
 *
 * `jest.mock` does not hoist under the ESM preset, so the mock is registered before the subject is
 * imported dynamically (see rules/testing.md §2.2).
 */
const managerQuery =
	createMockQuery() as unknown as jest.Mocked<DocumentSeriesQuery>;

jest.unstable_mockModule(
	'@/features/document-series/document-series.repository',
	() => ({
		getDocumentSeriesRepository: () => mockDocumentSeries.repository,
		createDocumentSeriesQuery: () => managerQuery,
	}),
);

const { DocumentSeriesService, formatReference } = await import(
	'@/features/document-series/document-series.service'
);

function createManagerMock() {
	const entityRepository = {
		save: jest.fn(async (row: unknown) => row as DocumentSeriesEntity),
		update: jest.fn(),
	};

	const manager = {
		getRepository: jest.fn(() => entityRepository),
		// The `[rows, affectedCount]` tuple TypeORM returns for a write, not a bare row array
		query: jest.fn(async () => [[{ number: 42 }], 1]),
	} as unknown as jest.Mocked<EntityManager> & {
		query: jest.Mock<
			(
				sql: string,
				parameters: unknown[],
			) => Promise<[Array<{ number: number }>, number]>
		>;
	};

	return { manager, entityRepository };
}

describe('DocumentSeriesService', () => {
	const service = new DocumentSeriesService(mockDocumentSeries.repository);

	it('should allocate the next number of the resolved series', async () => {
		const series = getDocumentSeriesEntityMock();
		const { manager } = createManagerMock();

		managerQuery.first.mockResolvedValue(series);

		const result = await service.allocate(
			manager,
			DocumentTypeEnum.INVOICE,
		);

		expect(manager.query).toHaveBeenCalledWith(
			expect.stringContaining('UPDATE "document_series"'),
			[series.id],
		);
		expect(result).toEqual({
			code: 'INV',
			number: 42,
			reference: 'INV-000042',
		});
	});

	it('should refuse to allocate when no series is configured', async () => {
		const { manager } = createManagerMock();

		managerQuery.first.mockResolvedValue(null);

		await expect(
			service.allocate(manager, DocumentTypeEnum.ORDER),
		).rejects.toThrow();

		expect(manager.query).not.toHaveBeenCalled();
	});

	describe('formatReference', () => {
		it('should pad the number to the series width', () => {
			expect(
				formatReference(
					{ code: 'INV', padding: 6, format: '{code}-{number}' },
					42,
				),
			).toBe('INV-000042');
		});

		it('should render a format with no separator', () => {
			expect(
				formatReference(
					{ code: 'S', padding: 5, format: '{code}{number}' },
					12345,
				),
			).toBe('S12345');
		});

		it('should leave a number wider than the padding untouched', () => {
			expect(
				formatReference(
					{ code: 'NIR', padding: 2, format: '{code}-{number}' },
					12345,
				),
			).toBe('NIR-12345');
		});
	});
});
