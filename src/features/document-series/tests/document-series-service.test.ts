import { expect, jest } from '@jest/globals';
import { type EntityManager, QueryFailedError } from 'typeorm';
import type DocumentSeriesEntity from '@/features/document-series/document-series.entity';
import { DocumentTypeEnum } from '@/features/document-series/document-series.entity';
import {
	documentSeriesOutputPayloads,
	getDocumentSeriesEntityMock,
} from '@/features/document-series/document-series.mock';
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

const { DocumentSeriesService } = await import(
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

	describe('create', () => {
		it('should save a series when the document type is free', async () => {
			const entry = getDocumentSeriesEntityMock();

			mockDocumentSeries.query.first.mockResolvedValue(null);
			mockDocumentSeries.repository.save.mockResolvedValue(entry);

			const result = await service.create(
				documentSeriesOutputPayloads.create,
			);

			expect(mockDocumentSeries.repository.save).toHaveBeenCalledWith(
				expect.objectContaining({
					document_type: DocumentTypeEnum.INVOICE,
					// A brand-new series has issued nothing
					next_number:
						documentSeriesOutputPayloads.create.start_number,
				}),
			);
			expect(result).toBe(entry);
		});

		it('should reject a second series for the same document type', async () => {
			mockDocumentSeries.query.first.mockResolvedValue(
				getDocumentSeriesEntityMock(),
			);

			await expect(
				service.create(documentSeriesOutputPayloads.create),
			).rejects.toThrow('document-series.error.already_exists');

			expect(mockDocumentSeries.repository.save).not.toHaveBeenCalled();
		});

		// The lookup above cannot see an insert still in flight, so the unique index is what
		// stops the loser of that race — as a driver error the handler would mask as a 500.
		it('should turn a unique violation into a conflict', async () => {
			mockDocumentSeries.query.first.mockResolvedValue(null);
			mockDocumentSeries.repository.save.mockRejectedValue(
				new QueryFailedError('insert', [], {
					code: '23505',
				} as unknown as Error),
			);

			await expect(
				service.create(documentSeriesOutputPayloads.create),
			).rejects.toThrow('document-series.error.already_exists');
		});

		it('should let an unrelated database error through', async () => {
			const failure = new QueryFailedError('insert', [], {
				code: '23502',
			} as unknown as Error);

			mockDocumentSeries.query.first.mockResolvedValue(null);
			mockDocumentSeries.repository.save.mockRejectedValue(failure);

			await expect(
				service.create(documentSeriesOutputPayloads.create),
			).rejects.toBe(failure);
		});
	});
});
