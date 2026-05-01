import type { DeepPartial, EntityManager, Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import { BadRequestError, CustomError } from '@/exceptions';
import BrandEntity, {
	type BrandStatus,
	type BrandType,
	STATUS_TRANSITIONS,
} from '@/features/brand/brand.entity';
import { getBrandRepository } from '@/features/brand/brand.repository';
import {
	type BrandValidator,
	paramsUpdateList,
} from '@/features/brand/brand.validator';
import BrandContentRepository from '@/features/brand/brand-content.repository';
import { assertValidStatusTransition } from '@/shared/abstracts/service.abstract';
import type { ValidatorOutput } from '@/shared/types/mock.type';

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
		const existing = await this.findBySlug(
			data.slug,
			data.brand_type,
			true,
		);

		if (existing) {
			throw new CustomError(409, lang('brand.error.already_exist'));
		}

		return dataSource.transaction(async (manager) => {
			const repository = this.getScopedBrandRepository(manager);

			const entry = {
				name: data.name,
				slug: data.slug,
				brand_type: data.brand_type,
			};

			const entrySaved = await repository.save(entry);

			await BrandContentRepository.saveContent(
				manager,
				data.contents,
				entrySaved.id,
			);

			return entrySaved;
		});
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<BrandEntity> & { id: number },
	): Promise<BrandEntity> {
		return this.repository.save(data);
	}

	public async updateDataWithContent(
		id: number,
		data: ValidatorOutput<BrandValidator, 'update'>,
		withDeleted: boolean,
	) {
		const entry = await this.findById(id, withDeleted);

		if (data.slug || data.brand_type) {
			const existing = await this.findBySlug(
				data.slug || entry.slug,
				data.brand_type || entry.brand_type,
				true,
				undefined,
				id,
			);

			if (existing) {
				throw new CustomError(409, lang('brand.error.already_exists'));
			}
		}

		return dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(BrandEntity);

			Object.assign(
				entry,
				Object.fromEntries(
					paramsUpdateList
						.filter((key) => key in data)
						.map((key) => [key, data[key as keyof typeof data]]),
				),
			);

			const updatedEntity = await repository.save(entry);

			if (data.contents) {
				await BrandContentRepository.saveContent(
					manager,
					data.contents,
					id,
				);
			}

			return updatedEntity;
		});
	}

	public async updateStatus(
		id: number,
		newStatus: BrandStatus,
		withDeleted: boolean,
	): Promise<void> {
		const entry = await this.findById(id, withDeleted);

		assertValidStatusTransition(
			STATUS_TRANSITIONS,
			entry.status,
			newStatus,
		);

		entry.status = newStatus;

		await this.update(entry);
	}

	public async updateOrder(
		brand_type: BrandType,
		ids: number[], // Array of IDs in the desired order
		withDeleted: boolean,
	): Promise<void> {
		// We make sure all the available IDs are present in the sorting (eg: ids)
		const count = await this.repository
			.createQuery()
			.filterBy('brand_type', brand_type)
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
		brand_type: BrandType,
		withDeleted: boolean,
		fields?: string[],
		excludeId?: number,
	) {
		const q = this.repository
			.createQuery()
			.filterBy('slug', slug)
			.filterBy('brand_type', brand_type)
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
		data: ValidatorOutput<BrandValidator, 'read'>,
		withDeleted: boolean,
	) {
		const query = this.repository
			.createQuery()
			.select([
				'brand.id',
				'brand.name',
				'brand.slug',
				'brand.status',
				'brand.brand_type',
				'brand.created_at',
				'brand.updated_at',
				'brand.deleted_at',

				'content.language',
				'content.description',
				'content.meta',
			])
			.filterById(id)
			.withDeleted(withDeleted);

		if (data.language) {
			query.joinAndSelect(
				'brand.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: data.language,
				},
			);
		} else {
			// No language: take all contents
			query.joinAndSelect('brand.contents', 'content', 'LEFT');
		}

		return await query.firstOrFail();
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
				'LEFT',
				'content.language = :language',
				{
					language: data.filter.language,
				},
			)
			.select([
				'brand.id',
				'brand.brand_type',
				'brand.name',
				'brand.slug',
				'brand.status',
				'brand.created_at',
				'brand.updated_at',
				'brand.deleted_at',

				'content.language',
				'content.description',
				'content.meta',
			])
			.filterById(data.filter.id)
			.filterBy('brand.brand_type', data.filter.brand_type)
			.filterBy('brand.status', data.filter.status)
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
