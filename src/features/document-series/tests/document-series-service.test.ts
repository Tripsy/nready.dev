import { expect, jest } from '@jest/globals';
import type { EntityManager } from 'typeorm';
import type DocumentSeriesEntity from '@/features/document-series/document-series.entity';
import {
	DocumentTypeEnum,
	YEAR_CONTINUOUS,
} from '@/features/document-series/document-series.entity';
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

		const result = await service.allocate(manager, {
			document_type: DocumentTypeEnum.INVOICE,
			at: new Date(series.year, 5, 1),
		});

		expect(manager.query).toHaveBeenCalledWith(
			expect.stringContaining('UPDATE "document_series"'),
			[series.id],
		);
		expect(result).toEqual({
			code: 'INV',
			year: series.year,
			number: 42,
			reference: `INV-${series.year}-0042`,
		});
	});

	it('should refuse to allocate when no series is configured', async () => {
		const { manager } = createManagerMock();

		managerQuery.first.mockResolvedValue(null);

		await expect(
			service.allocate(manager, {
				document_type: DocumentTypeEnum.ORDER,
			}),
		).rejects.toThrow();

		expect(manager.query).not.toHaveBeenCalled();
	});

	it('should open the new year and restart the counter on rollover', async () => {
		const series = getDocumentSeriesEntityMock();
		const { manager, entityRepository } = createManagerMock();

		// The series lookup finds last year's row, the year lookup then finds nothing
		managerQuery.first
			.mockResolvedValueOnce(series)
			.mockResolvedValueOnce(null);

		await service.allocate(manager, {
			document_type: DocumentTypeEnum.INVOICE,
			at: new Date(series.year + 1, 0, 1),
		});

		expect(entityRepository.save).toHaveBeenCalledWith(
			expect.objectContaining({
				year: series.year + 1,
				next_number: series.start_number,
			}),
		);
	});

	it('should reuse a continuous series without opening a year', async () => {
		const series = {
			...getDocumentSeriesEntityMock(),
			year: YEAR_CONTINUOUS,
			padding: 6,
			format: '{code}-{number}',
		};
		const { manager, entityRepository } = createManagerMock();

		managerQuery.first.mockResolvedValue(series);

		const result = await service.allocate(manager, {
			document_type: DocumentTypeEnum.ORDER,
		});

		expect(entityRepository.save).not.toHaveBeenCalled();
		expect(result.reference).toBe('INV-000042');
	});

	describe('formatReference', () => {
		it('should pad the number and drop the year of a continuous series', () => {
			expect(
				formatReference(
					{
						code: 'S',
						year: YEAR_CONTINUOUS,
						padding: 5,
						format: '{code}{number}',
					},
					12345,
				),
			).toBe('S12345');
		});

		it('should render a yearly series', () => {
			expect(
				formatReference(
					{
						code: 'INV',
						year: 2026,
						padding: 4,
						format: '{code}-{year}-{number}',
					},
					7,
				),
			).toBe('INV-2026-0007');
		});

		it('should leave a number wider than the padding untouched', () => {
			expect(
				formatReference(
					{
						code: 'NIR',
						year: YEAR_CONTINUOUS,
						padding: 2,
						format: '{code}-{number}',
					},
					12345,
				),
			).toBe('NIR-12345');
		});
	});
});
