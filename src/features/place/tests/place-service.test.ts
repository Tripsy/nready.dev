import { expect, jest } from '@jest/globals';
import type { EntityManager, ObjectLiteral, Repository } from 'typeorm';

import type PlaceEntity from '@/features/place/place.entity';
import {
	getPlaceEntityMock,
	placeInputPayloads,
	placeOutputPayloads,
} from '@/features/place/place.mock';
import type { PlaceQuery } from '@/features/place/place.repository';
import { PlaceService } from '@/features/place/place.service';
import type { PlaceValidator } from '@/features/place/place.validator';
import { PlaceContentRepository } from '@/features/place/place-content.repository';
import type RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import type { ValidatorOutput } from '@/shared/abstracts/validator.abstract';
import {
	createMockQuery,
	setupTransactionMock,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
} from '@/tests/jest-service.setup';

function createMockRepositoryForPlace<
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

describe('PlaceService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockPlace = createMockRepositoryForPlace<PlaceEntity, PlaceQuery>();

	const mockScopedRepository = createMockRepositoryForPlace<
		PlaceEntity,
		PlaceQuery
	>();

	const getScopedPlaceRepository = jest
		.fn()
		.mockReturnValue(
			mockScopedRepository.repository,
		) as jest.MockedFunction<
		(manager?: EntityManager) => Repository<PlaceEntity>
	>;

	const servicePlace = new PlaceService(
		mockPlace.repository,
		getScopedPlaceRepository,
	);

	it('should create entry inside transaction and save content', async () => {
		const entity = getPlaceEntityMock();
		const createData = placeOutputPayloads.get('create');

		const { transaction } = setupTransactionMock();

		mockScopedRepository.repository.save.mockResolvedValue(entity);

		jest.spyOn(PlaceContentRepository, 'saveContent').mockResolvedValue(
			undefined,
		);

		const result = await servicePlace.create(createData);

		expect(transaction).toHaveBeenCalled();

		expect(mockScopedRepository.repository.save).toHaveBeenCalledWith({
			type: createData.type,
			code: createData.code,
			parent_id: createData.parent_id,
		});

		expect(result).toBe(entity);
	});

	testServiceFindById<PlaceEntity, PlaceQuery>(mockPlace.query, servicePlace);

	testServiceFindByFilter<PlaceEntity, PlaceQuery, PlaceValidator>(
		mockPlace.query,
		servicePlace,
		placeInputPayloads.get('find') as ValidatorOutput<
			PlaceValidator,
			'find'
		>,
	);

	it('should delete when has no children', async () => {
		jest.spyOn(servicePlace, 'hasChildren').mockResolvedValue(undefined);

		mockPlace.query.delete.mockResolvedValue(1);

		await servicePlace.delete(1);

		expect(mockPlace.query.delete).toHaveBeenCalled();
	});

	testServiceRestore<PlaceEntity, PlaceQuery>(mockPlace.query, servicePlace);
});
