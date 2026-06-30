import { expect, jest } from '@jest/globals';
import type { EntityManager, Repository, TreeRepository } from 'typeorm';
import type CategoryEntity from '@/features/category/category.entity';
import {
	categoryInputPayloads,
	getCategoryEntityMock,
} from '@/features/category/category.mock';
import type { CategoryQuery } from '@/features/category/category.repository';
import { CategoryService } from '@/features/category/category.service';
import type { CategoryValidator } from '@/features/category/category.validator';
import { createCurrentDate } from '@/helpers';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import {
	createMockRepository,
	testServiceFindByFilter,
	testServiceFindById,
} from '@/tests/jest-service.setup';

describe('CategoryService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockCategory = createMockRepository<CategoryEntity, CategoryQuery>();
	const getScopedCategoryRepository = jest.fn() as jest.MockedFunction<
		(manager?: EntityManager) => Repository<CategoryEntity>
	>;

	const serviceCategory = new CategoryService(
		mockCategory.repository,
		getScopedCategoryRepository,
	);

	// TODO
	// create
	// updateDataWithContent
	// updateStatus

	testServiceFindById<CategoryEntity, CategoryQuery>(
		mockCategory.query,
		serviceCategory,
	);

	testServiceFindByFilter<CategoryEntity, CategoryQuery, CategoryValidator>(
		mockCategory.query,
		serviceCategory,
		categoryInputPayloads.find,
	);

	it('should delete by id', async () => {
		jest.spyOn(serviceCategory, 'findById').mockResolvedValue({
			...getCategoryEntityMock(),
			deleted_at: null,
		});
		mockCategory.query.delete.mockResolvedValue(1);

		const mockFindDescendants = jest
			.fn<(entity: CategoryEntity) => Promise<CategoryEntity[]>>()
			.mockResolvedValue([getCategoryEntityMock()]);

		jest.spyOn(RepositoryAbstract, 'getTreeRepository').mockReturnValue({
			findDescendants: mockFindDescendants,
		} as unknown as TreeRepository<CategoryEntity>);

		await serviceCategory.delete(1);

		expect(mockCategory.query.delete).toHaveBeenCalledWith();
	});

	it('should restore by id', async () => {
		mockCategory.query.firstOrFail.mockResolvedValue({
			...getCategoryEntityMock(),
			deleted_at: createCurrentDate(),
			parent: null,
		});
		mockCategory.query.restore.mockReturnThis();

		await serviceCategory.restore(1);

		expect(mockCategory.query.filterById).toHaveBeenCalledWith(1);
		expect(mockCategory.query.restore).toHaveBeenCalledWith();
	});
});
