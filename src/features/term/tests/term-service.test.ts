import { expect, jest } from '@jest/globals';
import type TermEntity from '@/features/term/term.entity';
import {
	getTermEntityMock,
	termOutputPayloads,
} from '@/features/term/term.mock';
import type { TermQuery } from '@/features/term/term.repository';
import { TermService } from '@/features/term/term.service';
import type { TermValidator } from '@/features/term/term.validator';
import { TermContentRepository } from '@/features/term/term-content.repository';
import {
	createMockRepository,
	setupTransactionMock,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
} from '@/tests/jest-service.setup';

describe('TermService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockTerm = createMockRepository<TermEntity, TermQuery>();

	const serviceTerm = new TermService(mockTerm.repository);

	it('should create entry inside transaction and save content', async () => {
		const entity = getTermEntityMock();
		const createData = termOutputPayloads.create;

		const { transaction } = setupTransactionMock(mockTerm.repository);

		// No existing term carries this wording
		mockTerm.query.first.mockResolvedValue(null);
		mockTerm.repository.save.mockResolvedValue(entity);

		const saveContent = jest
			.spyOn(TermContentRepository, 'saveContent')
			.mockResolvedValue(undefined);

		const result = await serviceTerm.create(createData);

		expect(transaction).toHaveBeenCalled();

		expect(mockTerm.repository.save).toHaveBeenCalledWith({
			type: createData.type,
		});

		expect(saveContent).toHaveBeenCalledWith(
			expect.anything(),
			createData.contents,
			entity.id,
		);

		expect(result).toBe(entity);
	});

	it('should reject a term whose wording is already used by another term of the same type', async () => {
		setupTransactionMock(mockTerm.repository);

		mockTerm.query.first.mockResolvedValue(getTermEntityMock());

		await expect(
			serviceTerm.create(termOutputPayloads.create),
		).rejects.toMatchObject({ statusCode: 409 });

		expect(mockTerm.repository.save).not.toHaveBeenCalled();
	});

	it('should exclude the entry being updated from the duplicate check', async () => {
		const entity = getTermEntityMock();

		setupTransactionMock(mockTerm.repository);

		mockTerm.query.first.mockResolvedValue(null);
		mockTerm.repository.save.mockResolvedValue(entity);

		jest.spyOn(TermContentRepository, 'saveContent').mockResolvedValue(
			undefined,
		);

		await serviceTerm.updateDataWithContent(
			entity,
			termOutputPayloads.update,
		);

		expect(mockTerm.query.filterBy).toHaveBeenCalledWith(
			'term.id',
			entity.id,
			'!=',
		);
	});

	testServiceUpdate<TermEntity>(
		serviceTerm,
		mockTerm.repository,
		getTermEntityMock(),
	);

	testServiceDelete<TermEntity, TermQuery>(mockTerm.query, serviceTerm);
	testServiceRestore<TermEntity, TermQuery>(mockTerm.query, serviceTerm);
	testServiceFindById<TermEntity, TermQuery>(mockTerm.query, serviceTerm);

	testServiceFindByFilter<TermEntity, TermQuery, TermValidator>(
		mockTerm.query,
		serviceTerm,
		termOutputPayloads.find,
	);
});
