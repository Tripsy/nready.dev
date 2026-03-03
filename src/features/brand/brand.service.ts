import type { EntityManager, Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import { BadRequestError, CustomError } from '@/exceptions';
import BrandEntity, {
	type BrandStatusEnum,
	type BrandTypeEnum,
} from '@/features/brand/brand.entity';
import { getBrandRepository } from '@/features/brand/brand.repository';
import {
	type BrandValidator,
	paramsUpdateList,
} from '@/features/brand/brand.validator';
import BrandContentRepository from '@/features/brand/brand-content.repository';
import type { ValidatorOutput } from '@/shared/abstracts/validator.abstract';

export class BrandService {
	constructor(
		private repository: ReturnType<typeof getBrandRepository>,
		private getScopedBrandRepository: (
			manager?: EntityManager,
		) => Repository<BrandEntity>,
	) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<BrandValidator, 'create'>,
	): Promise<BrandEntity> {
		const existing = await this.findBySlug(data.slug, data.type, true);

		if (existing) {
			throw new CustomError(409, lang('brand.error.already_exist'));
		}

		return dataSource.transaction(async (manager) => {
			const repository = this.getScopedBrandRepository(manager);

			const entry = {
				name: data.name,
				slug: data.slug,
				type: data.type,
			};

			const entrySaved = await repository.save(entry);

			await BrandContentRepository.saveContent(
				manager,
				data.content,
				entrySaved.id,
			);

			return entrySaved;
		});
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateDataWithContent(
		id: number,
		data: ValidatorOutput<BrandValidator, 'update'>,
		withDeleted: boolean,
	) {
		const brand = await this.findById(id, withDeleted);

		if (data.slug || data.type) {
			const existing = await this.findBySlug(
				data.slug || brand.slug,
				data.type || brand.type,
				true,
				undefined,
				id,
			);

			if (existing) {
				throw new CustomError(409, lang('brand.error.already_exists'));
			}
		}

		return dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(BrandEntity); // We use the manager -> `getBrandRepository` is not bound to the transaction

			const updateData = {
				...Object.fromEntries(
					paramsUpdateList
						.filter((key) => key in data)
						.map((key) => [key, data[key as keyof typeof data]]),
				),
				id,
			};

			const updatedEntity = await repository.save(updateData);

			if (data.content) {
				await BrandContentRepository.saveContent(
					manager,
					data.content,
					id,
				);
			}

			return updatedEntity;
		});
	}

	public async updateStatus(
		id: number,
		newStatus: BrandStatusEnum,
		withDeleted: boolean,
	): Promise<void> {
		const entry = await this.findById(id, withDeleted);

		if (entry.status === newStatus) {
			throw new BadRequestError(
				lang('brand.error.status_unchanged', { status: newStatus }),
			);
		}

		entry.status = newStatus;

		await this.repository.save(entry);
	}

	public async updateOrder(
		type: BrandTypeEnum,
		ids: number[], // Array of IDs in the desired order
		withDeleted: boolean,
	): Promise<void> {
		// We make sure all the available IDs are present in the sorting (eg: ids)
		const count = await this.repository
			.createQuery()
			.filterBy('type', type)
			// .filterBy('id', ids, 'IN') // In case we want to allow partial sorting
			.withDeleted(withDeleted)
			.count();

		if (count !== ids.length) {
			throw new BadRequestError(
				lang('brand.validation.invalid_ids_provided'),
			);
		}

		await dataSource.transaction(async (manager) => {
			const cases = ids
				.map((id, index) => `WHEN ${id} THEN ${ids.length - index}`)
				.join(' ');

			await manager.query(`
                UPDATE brand
                SET sort_order = CASE id
                    ${cases}
                END
                WHERE id IN (${ids.join(',')})
            `);
		});
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<BrandEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findBySlug(
		slug: string,
		type: BrandTypeEnum,
		withDeleted: boolean,
		fields?: string[],
		excludeId?: number,
	) {
		const q = this.repository
			.createQuery()
			.filterBy('slug', slug)
			.filterBy('type', type)
			.withDeleted(withDeleted);

		if (excludeId) {
			q.filterBy('id', excludeId, '!=');
		}

		if (fields) {
			q.select(fields);
		}

		return q.first();
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 */
	public async getDataById(
		id: number,
		language: string,
		withDeleted: boolean,
	) {
		return await this.repository
			.createQuery()
			.joinAndSelect(
				'brand.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: language,
				},
			)
			.select([
				'brand.id',
				'brand.name',
				'brand.slug',
				'brand.type',
				'brand.created_at',
				'brand.updated_at',
				'brand.deleted_at',

				'content.language',
				'content.description',
				'content.meta',
			])
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByFilter(
		data: ValidatorOutput<BrandValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.join(
				'brand.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: data.filter.language,
				},
			)
			.select([
				'brand.id',
				'brand.name',
				'brand.slug',
				'brand.type',
				'brand.created_at',
				'brand.updated_at',
				'brand.deleted_at',

				'content.language',
				'content.description',
				'content.meta',
			])
			.filterById(data.filter.id)
			.filterBy('brand.type', data.filter.type)
			.filterBy('brand.status', data.filter.status)
			.filterBy('content.language', data.filter.language)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export function getScopedBrandRepository(manager?: EntityManager) {
	return (manager ?? dataSource.manager).getRepository(BrandEntity);
}

export const brandService = new BrandService(
	getBrandRepository(),
	getScopedBrandRepository,
);
