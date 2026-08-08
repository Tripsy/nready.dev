import { expect, jest } from '@jest/globals';
import type TermEntity from '@/features/term/term.entity';
import {
	getTermEntityMock,
	termInputPayloads,
	termOutputPayloads,
} from '@/features/term/term.mock';
import type { TermQuery } from '@/features/term/term.repository';
import { TermService } from '@/features/term/term.service';
import type { TermValidator } from '@/features/term/term.validator';
import {
	createMockRepository,
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

	it('should create entry', async () => {
		const entity = getTermEntityMock();
		const createData = termOutputPayloads.create;

		jest.spyOn(serviceTerm, 'findByValue').mockResolvedValue(null);
		mockTerm.repository.save.mockResolvedValue(entity);

		const result = await serviceTerm.create(createData);

		expect(mockTerm.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	it('should reject a duplicate on create', async () => {
		jest.spyOn(serviceTerm, 'findByValue').mockResolvedValue(
			getTermEntityMock(),
		);

		await expect(
			serviceTerm.create(termOutputPayloads.create),
		).rejects.toMatchObject({ statusCode: 409 });

		expect(mockTerm.repository.save).not.toHaveBeenCalled();
	});

	it('should exclude the entry being updated from the duplicate check', async () => {
		const entity = getTermEntityMock();

		const findByValue = jest
			.spyOn(serviceTerm, 'findByValue')
			.mockResolvedValue(null);

		mockTerm.repository.save.mockResolvedValue(entity);

		await serviceTerm.updateData(entity, termOutputPayloads.update);

		expect(findByValue).toHaveBeenCalledWith(
			entity.type,
			entity.language,
			termInputPayloads.update.value,
			entity.id,
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
