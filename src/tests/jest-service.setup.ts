import { expect, jest } from '@jest/globals';
import type { EntityManager, ObjectLiteral, Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import type RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import type { ValidatorOutput } from '@/shared/types/mock.type';

export function createMockQuery() {
	return {
		// Chainable methods
		select: jest.fn().mockReturnThis(),
		join: jest.fn().mockReturnThis(),
		joinAndSelect: jest.fn().mockReturnThis(),
		filterBy: jest.fn().mockReturnThis(),
		filterById: jest.fn().mockReturnThis(),
		filterByRange: jest.fn().mockReturnThis(),
		filterByTerm: jest.fn().mockReturnThis(),
		filterByStatus: jest.fn().mockReturnThis(),
		filterByEmail: jest.fn().mockReturnThis(),
		filterByTemplate: jest.fn().mockReturnThis(),
		filterByIdent: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		pagination: jest.fn().mockReturnThis(),
		withDeleted: jest.fn().mockReturnThis(),

		// Methods from RepositoryAbstract
		filterAny: jest.fn().mockReturnThis(),

		// Execute methods
		save: jest.fn(),
		delete: jest.fn(),
		restore: jest.fn(),
		firstOrFail: jest.fn(),
		first: jest.fn(),
		firstRaw: jest.fn(),
		all: jest.fn(),
		count: jest.fn(),
	};
}

export function createMockRepository<
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

export function createMockContentRepository<
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
		saveContent: jest.fn(),
	};

	return {
		query,
		repository,
	};
}

export function setupTransactionMock() {
	const manager = {
		query: jest.fn(),
		getRepository: jest.fn(),
	};

	const transaction = jest
		.spyOn(dataSource, 'transaction')
		.mockImplementation(
			async <T>(
				isolationOrCb:
					| ((manager: EntityManager) => Promise<T>)
					| string,
				maybeCb?: (manager: EntityManager) => Promise<T>,
			): Promise<T> => {
				if (typeof isolationOrCb === 'function') {
					return isolationOrCb(manager as unknown as EntityManager);
				} else {
					if (!maybeCb) {
						throw new Error(
							'Callback is required when isolation level is provided',
						);
					}
					return maybeCb(manager as unknown as EntityManager);
				}
			},
		);

	return { transaction, manager };
}

interface IUpdateService<E> {
	update(data: Partial<E> & { id: number }): Promise<Partial<E>>;
}

export function testServiceUpdate<E extends ObjectLiteral>(
	service: IUpdateService<E>,
	repository: jest.Mocked<Repository<E>>,
	saveData: E & { id: number },
) {
	it('should update', async () => {
		repository.save.mockResolvedValue(saveData);

		await service.update(saveData);

		expect(repository.save).toHaveBeenCalled();
	});
}

interface IUpdateStatusService<E, S> {
	findById(id: number, withDeleted?: boolean): Promise<E>;
	updateStatus(id: number, newStatus: S, withDeleted: boolean): Promise<void>;
}

export function testServiceUpdateStatus<
	E extends ObjectLiteral,
	S extends string,
>(
	service: IUpdateStatusService<E, S>,
	repository: jest.Mocked<Repository<E>>,
	statusTransitions: {
		good: { from: S; to: S };
		bad?: { from: S; to: S };
	},
) {
	it('updateStatus - status_unchanged', async () => {
		const entity = {
			id: 1,
			status: statusTransitions.good.from,
		} as unknown as E;

		jest.spyOn(service, 'findById').mockResolvedValue(entity);

		await expect(
			service.updateStatus(entity.id, statusTransitions.good.from, false),
		).rejects.toThrow('shared.error.status_unchanged');
	});

	if (statusTransitions.bad !== undefined) {
		const badTransition = statusTransitions.bad;

		it('updateStatus - status_update_not_allowed', async () => {
			const entity = {
				id: 1,
				status: badTransition.from,
			} as unknown as E;

			jest.spyOn(service, 'findById').mockResolvedValue(entity);

			await expect(
				service.updateStatus(entity.id, badTransition.to, false),
			).rejects.toThrow('shared.error.status_update_not_allowed');
		});
	}

	it('updateStatus - success', async () => {
		const entity = {
			id: 1,
			status: statusTransitions.good.from,
		} as unknown as E;

		jest.spyOn(service, 'findById').mockResolvedValue(entity);

		repository.save.mockResolvedValue(entity);

		await service.updateStatus(entity.id, statusTransitions.good.to, false);

		expect(repository.save).toHaveBeenCalled();
	});
}

interface IDeleteService {
	delete(id: number, relatedId?: number): Promise<void>;
}

export function testServiceDelete<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>(query: jest.Mocked<Q>, service: IDeleteService) {
	it('should delete by id', async () => {
		query.delete.mockResolvedValue(1);

		await service.delete(1);

		expect(query.filterById).toHaveBeenCalledWith(1);
		expect(query.delete).toHaveBeenCalledWith();
	});
}

interface IDeleteMultipleService {
	delete(data: { ids: number[] }): Promise<number>;
}

export function testServiceDeleteMultiple<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>(
	query: jest.Mocked<Q>,
	service: IDeleteMultipleService,
	deleteData: { ids: number[] },
) {
	it('should delete by ids', async () => {
		query.delete.mockResolvedValue(3);

		const result = await service.delete(deleteData);

		expect(query.delete).toHaveBeenCalledWith(false, true, true);
		expect(result).toBe(3);
	});
}

interface IRestoreService {
	restore(id: number, relatedId?: number): Promise<void>;
}

export function testServiceRestore<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>(query: jest.Mocked<Q>, service: IRestoreService) {
	it('should restore by id', async () => {
		query.restore.mockReturnThis();

		await service.restore(1);

		expect(query.filterById).toHaveBeenCalledWith(1);
		expect(query.restore).toHaveBeenCalledWith();
	});
}

interface IFindByIdService<E extends ObjectLiteral> {
	findById(id: number, withDeleted?: boolean, relatedId?: number): Promise<E>;
}

export function testServiceFindById<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
>(query: jest.Mocked<Q>, service: IFindByIdService<E>) {
	it('should find entity by id', async () => {
		const entity = { id: 1 };

		query.firstOrFail.mockResolvedValue(entity);

		const result = await service.findById(entity.id, true);

		expect(query.filterById).toHaveBeenCalledWith(entity.id);
		expect(query.firstOrFail).toHaveBeenCalled();
		expect(result).toBe(entity);
	});
}

interface IFindByFilterService<
	E extends ObjectLiteral,
	V extends Record<'find', unknown>,
> {
	findByFilter(
		filter: ValidatorOutput<V, 'find'>,
		withDeleted?: boolean,
	): Promise<[E[], number] | E[]>;
}

export function testServiceFindByFilter<
	E extends ObjectLiteral,
	Q extends RepositoryAbstract<E>,
	V extends Record<'find', unknown>,
>(
	query: jest.Mocked<Q>,
	service: IFindByFilterService<E, V>,
	findData: ValidatorOutput<V, 'find'>,
) {
	it('should apply filters and return paginated results', async () => {
		query.all.mockResolvedValue([[], 0]);

		const result = await service.findByFilter(findData);

		expect(query.all).toHaveBeenCalledWith(true);
		expect(result).toEqual([[], 0]);
	});
}
