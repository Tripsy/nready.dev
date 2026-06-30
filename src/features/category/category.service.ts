import type { DeepPartial, EntityManager, Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import { CustomError } from '@/exceptions';
import CategoryEntity, {
	type CategoryStatus,
	CategoryStatusEnum,
	STATUS_TRANSITIONS,
} from '@/features/category/category.entity';
import { getCategoryRepository } from '@/features/category/category.repository';
import type { CategoryValidator } from '@/features/category/category.validator';
import CategoryContentRepository from '@/features/category/category-content.repository';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import { assertValidStatusTransition } from '@/shared/abstracts/service.abstract';
import type { ValidatorOutput } from '@/shared/types/mock.type';

export class CategoryService {
	constructor(
		private repository: ReturnType<typeof getCategoryRepository>,
		private getScopedCategoryRepository: (
			manager?: EntityManager,
		) => Repository<CategoryEntity>,
	) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<CategoryValidator, 'create'>,
	): Promise<CategoryEntity> {
		return dataSource.transaction(async (manager) => {
			const repository = this.getScopedCategoryRepository(manager);

			const entry: DeepPartial<CategoryEntity> = {
				type: data.type,
				parent: null,
			};

			if (data.parent_id) {
				const parent = await repository
					.createQueryBuilder()
					.where('id = :id', {
						id: data.parent_id,
					})
					.getOne();

				if (parent) {
					if (data.type !== parent.type) {
						throw new CustomError(
							400,
							lang('category.error.invalid_parent_type'),
						);
					}

					entry.parent = parent;
				} else {
					throw new CustomError(
						409,
						lang('category.error.parent_not_found'),
					);
				}
			}

			const entrySaved = await repository.save(entry);

			await CategoryContentRepository.saveContent(
				manager,
				data.contents,
				entrySaved.id,
				entrySaved.type,
			);

			return entrySaved;
		});
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateDataWithContent(
		entry: CategoryEntity,
		data: ValidatorOutput<CategoryValidator, 'update'>,
	) {
		if (data.parent_id) {
			if (entry.parent && entry.parent.id === data.parent_id) {
				throw new CustomError(400, lang('category.error.parent_same'));
			}

			const newParent = await this.findById(data.parent_id, true);

			if (!newParent) {
				throw new CustomError(
					409,
					lang('category.error.parent_not_found'),
				);
			}

			if (newParent.deleted_at && !entry.deleted_at) {
				throw new CustomError(
					400,
					lang('category.error.parent_deleted'),
				);
			}

			if (
				newParent.status !== CategoryStatusEnum.ACTIVE &&
				entry.status === CategoryStatusEnum.ACTIVE
			) {
				throw new CustomError(
					400,
					lang('category.error.parent_not_active'),
				);
			}

			if (entry.type !== newParent.type) {
				throw new CustomError(
					400,
					lang('category.error.invalid_parent_type', {
						type: entry.type,
					}),
				);
			}

			const treeRepository =
				RepositoryAbstract.getTreeRepository(CategoryEntity);
			const descendants = await treeRepository.findDescendants(entry);

			if (descendants.some((d) => d.id === data.parent_id)) {
				throw new CustomError(
					400,
					lang('category.error.parent_descendant'),
				);
			}
		}

		return dataSource.transaction(async (manager) => {
			if (entry.parent && 'parent_id' in data) {
				let flagUpdate = false;

				if (data.parent_id === null) {
					entry.parent = null;

					flagUpdate = true;
				} else if (entry.parent.id !== data.parent_id) {
					entry.parent = {
						id: data.parent_id,
					} as CategoryEntity;

					flagUpdate = true;
				}

				if (flagUpdate) {
					const repository = manager.getRepository(CategoryEntity); // We use the manager -> `getCategoryRepository` is not bound to the transaction

					await repository.save(entry);
				}
			}

			if (data.contents) {
				await CategoryContentRepository.saveContent(
					manager,
					data.contents,
					entry.id,
					entry.type,
				);
			}

			return entry;
		});
	}

	public async updateStatus(
		entry: CategoryEntity,
		newStatus: CategoryStatus,
		forceUpdate?: boolean, // When `true` & newStatus is CategoryStatusEnum.INACTIVE the active descendants will also be marked as inactive
	): Promise<void> {
		await dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(CategoryEntity); // We use the manager -> `getCategoryRepository` is not bound to the transaction

			assertValidStatusTransition(
				STATUS_TRANSITIONS,
				entry.status,
				newStatus,
			);

			if (newStatus === CategoryStatusEnum.INACTIVE) {
				const treeRepository =
					manager.getTreeRepository(CategoryEntity);

				const activeDescendantsData = await treeRepository
					.createDescendantsQueryBuilder('category', 'closure', entry)
					.select('category.id', 'id')
					.where('category.status = :status', {
						status: CategoryStatusEnum.ACTIVE,
					})
					.getRawMany<{ id: number }>();

				const activeDescendants = activeDescendantsData.filter(
					(d) => d.id !== entry.id,
				);

				if (activeDescendants.length > 0) {
					if (!forceUpdate) {
						throw new CustomError(
							400,
							lang('category.error.has_active_descendants'),
						);
					} else {
						await repository
							.createQueryBuilder()
							.update(CategoryEntity)
							.set({ status: CategoryStatusEnum.INACTIVE })
							.where('id IN (:...ids)', {
								ids: activeDescendants.map((d) => d.id),
							})
							.execute();
					}
				}
			}

			entry.status = newStatus;

			await repository.save(entry);
		});
	}

	public async delete(id: number) {
		const category = await this.findById(id, true);

		if (category.deleted_at) {
			throw new CustomError(409, lang('category.error.already_deleted'));
		}

		const treeRepository =
			RepositoryAbstract.getTreeRepository(CategoryEntity);

		const descendants = await treeRepository.findDescendants(category);

		const hasActiveDescendant = descendants.some(
			(d) => d.id !== category.id && !d.deleted_at,
		);

		if (hasActiveDescendant) {
			throw new CustomError(409, lang('category.error.has_descendants'));
		}

		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		const category = await this.repository
			.createQuery()
			.joinAndSelect('category.parent', 'parent', 'LEFT')
			.filterById(id)
			.withDeleted(true)
			.firstOrFail();

		if (category.deleted_at === null) {
			throw new CustomError(400, lang('category.error.not_deleted'));
		}

		if (category.parent?.deleted_at) {
			throw new CustomError(400, lang('category.error.parent_deleted'));
		}

		if (
			category.parent &&
			category.parent.status !== CategoryStatusEnum.ACTIVE
		) {
			throw new CustomError(
				400,
				lang('category.error.parent_not_active'),
			);
		}

		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<CategoryEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 */
	public async getEntryData(data: {
		id: number;
		with_ancestors: boolean;
		with_children: boolean;
		language: string | undefined;
		withDeleted: boolean;
	}) {
		const categoryQuery = this.repository
			.createQuery()
			.filterById(data.id)
			.withDeleted(data.withDeleted);

		if (data.language) {
			categoryQuery.joinAndSelect(
				'category.contents',
				'content',
				'INNER',
				'content.language = :language',
				{ language: data.language },
			);
		} else {
			// No language: take all contents
			categoryQuery.joinAndSelect('category.contents', 'content', 'LEFT');
		}

		const categoryEntry = await categoryQuery.firstOrFail();

		const treeRepository =
			RepositoryAbstract.getTreeRepository(CategoryEntity);

		let ancestorsWithContent: CategoryEntity[] = [];
		let childrenWithContent: CategoryEntity[] = [];

		if (data.with_ancestors || data.with_children) {
			const ancestors = await treeRepository.findAncestors(categoryEntry);

			if (data.with_ancestors) {
				const orderedIds = ancestors
					.filter((a) => a.id !== categoryEntry.id) // Exclude the current category
					.map((a) => a.id);

				const ancestorsWithContentDataQuery = getCategoryRepository()
					.createQuery()
					.filterBy('id', orderedIds, 'IN')
					.withDeleted(data.withDeleted);

				if (data.language) {
					ancestorsWithContentDataQuery.joinAndSelect(
						'category.contents',
						'content',
						'INNER',
						'content.language = :language',
						{ language: data.language },
					);
				} else {
					// No language: take all contents
					ancestorsWithContentDataQuery.joinAndSelect(
						'category.contents',
						'content',
						'LEFT',
					);
				}

				const ancestorsWithContentData =
					await ancestorsWithContentDataQuery.all();

				ancestorsWithContent = orderedIds
					.map((id) =>
						ancestorsWithContentData.find((a) => a.id === id),
					)
					.filter((a): a is CategoryEntity => a !== undefined);
			}

			if (data.with_children) {
				const childrenWithContentQuery = getCategoryRepository()
					.createQuery()
					.filterBy('parent_id', categoryEntry.id)
					.withDeleted(data.withDeleted);

				if (data.language) {
					childrenWithContentQuery.joinAndSelect(
						'category.contents',
						'content',
						'INNER',
						'content.language = :language',
						{ language: data.language },
					);
				} else {
					// No language: take all contents
					childrenWithContentQuery.joinAndSelect(
						'category.contents',
						'content',
						'LEFT',
					);
				}

				childrenWithContent = await childrenWithContentQuery.all();
			}
		}

		return {
			...categoryEntry,
			...(data.with_ancestors && {
				ancestors: ancestorsWithContent,
			}),
			...(data.with_children && {
				children: childrenWithContent,
			}),
		};
	}

	public findByFilter(
		data: ValidatorOutput<CategoryValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.join(
				'category.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: data.filter.language,
				},
			)
			.join('category.parent', 'parent', 'LEFT')
			.join(
				'parent.contents',
				'parentContent',
				'LEFT',
				'parentContent.language = :language',
				{
					language: data.filter.language,
				},
			)
			.select([
				'category.id',
				'category.type',
				'category.status',
				'category.created_at',
				'category.deleted_at',

				'content.language',
				'content.label',
				'content.slug',

				'parent.id',

				'parentContent.label',
			])
			.filterBy('type', data.filter.type)
			.filterBy('status', data.filter.status)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export function getScopedCategoryRepository(manager?: EntityManager) {
	return (manager ?? dataSource.manager).getRepository(CategoryEntity);
}

export const categoryService = new CategoryService(
	getCategoryRepository(),
	getScopedCategoryRepository,
);
