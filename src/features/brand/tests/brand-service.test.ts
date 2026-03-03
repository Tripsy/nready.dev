import { expect, jest } from '@jest/globals';
import type { EntityManager, ObjectLiteral, Repository } from 'typeorm';
import type BrandEntity from '@/features/brand/brand.entity';
import { BrandStatusEnum, BrandTypeEnum } from '@/features/brand/brand.entity';
import {
	brandInputPayloads,
	brandOutputPayloads,
	getBrandEntityMock,
} from '@/features/brand/brand.mock';
import type { BrandQuery } from '@/features/brand/brand.repository';
import { BrandService } from '@/features/brand/brand.service';
import type { BrandValidator } from '@/features/brand/brand.validator';
import { BrandContentRepository } from '@/features/brand/brand-content.repository';
import type RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import type { ValidatorOutput } from '@/shared/abstracts/validator.abstract';
import {
	createMockQuery,
	setupTransactionMock,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdateStatus,
} from '@/tests/jest-service.setup';

function createMockRepositoryForBrand<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>() {
	const query = createMockQuery() as unknown as jest.Mocked<Q>;

	const createQueryMock = jest.fn(() => {
		return query;
	});

	const repository = {
		createQuery: createQueryMock,
		save: jest.fn(),
	} as unknown as jest.Mocked<Repository<E>> & {
		createQuery(): Q;
	};

	return {
		query,
		repository,
	};
}

describe('BrandService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockBrand = createMockRepositoryForBrand<BrandEntity, BrandQuery>();

	const mockScopedRepository = createMockRepositoryForBrand<
		BrandEntity,
		BrandQuery
	>();

	const getScopedBrandRepository = jest
		.fn()
		.mockReturnValue(
			mockScopedRepository.repository,
		) as jest.MockedFunction<
		(manager?: EntityManager) => Repository<BrandEntity>
	>;

	const serviceBrand = new BrandService(
		mockBrand.repository,
		getScopedBrandRepository,
	);

	it('should create entry inside transaction and save content', async () => {
		const entity = getBrandEntityMock();
		const createData = brandOutputPayloads.get('create');

		const { transaction } = setupTransactionMock();

		mockScopedRepository.repository.save.mockResolvedValue(entity);

		jest.spyOn(BrandContentRepository, 'saveContent').mockResolvedValue(
			undefined,
		);

		const result = await serviceBrand.create(createData);

		expect(transaction).toHaveBeenCalled();

		expect(mockScopedRepository.repository.save).toHaveBeenCalledWith({
			name: createData.name,
			slug: createData.slug,
			type: createData.type,
		});

		expect(result).toBe(entity);
	});

	testServiceUpdateStatus<BrandEntity, BrandStatusEnum>(
		serviceBrand,
		mockBrand.repository,
		{
			good: {
				from: BrandStatusEnum.INACTIVE,
				to: BrandStatusEnum.ACTIVE,
			},
			bad: undefined,
		},
	);

	it('updateOrder - success', async () => {
		mockBrand.query.count.mockResolvedValue(2);

		const { transaction, manager } = setupTransactionMock();

		await serviceBrand.updateOrder(BrandTypeEnum.PRODUCT, [1, 2], true);

		expect(transaction).toHaveBeenCalled();
		expect(manager.query).toHaveBeenCalled();
	});

	testServiceFindById<BrandEntity, BrandQuery>(mockBrand.query, serviceBrand);

	it('should find entity by slug', async () => {
		const entity = getBrandEntityMock();

		mockBrand.query.first.mockResolvedValue(entity);

		const result = await serviceBrand.findBySlug(
			entity.slug,
			entity.type,
			true,
		);

		expect(mockBrand.query.first).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceFindByFilter<BrandEntity, BrandQuery, BrandValidator>(
		mockBrand.query,
		serviceBrand,
		brandInputPayloads.get('find') as ValidatorOutput<
			BrandValidator,
			'find'
		>,
	);

	testServiceDelete<BrandEntity, BrandQuery>(mockBrand.query, serviceBrand);

	testServiceRestore<BrandEntity, BrandQuery>(mockBrand.query, serviceBrand);
});
