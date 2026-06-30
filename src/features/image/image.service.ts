import type { DeepPartial } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import { BadRequestError } from '@/exceptions';
import ImageEntity, {
	type ImageSection,
	type ImageStatus,
	ImageStatusEnum,
	ImageTypeEnum,
	STATUS_TRANSITIONS,
} from '@/features/image/image.entity';
import { getImageRepository } from '@/features/image/image.repository';
import {
	type ImageValidator,
	paramsUpdateList,
} from '@/features/image/image.validator';
import ImageContentRepository from '@/features/image/image-content.repository';
import { pickValuesFromObject } from '@/helpers';
import { assertValidStatusTransition } from '@/shared/abstracts/service.abstract';
import type { ValidatorOutput } from '@/shared/types/mock.type';

export class ImageService {
	constructor(private repository: ReturnType<typeof getImageRepository>) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<ImageValidator, 'create'>,
	): Promise<ImageEntity> {
		return dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(ImageEntity);

			const entry = {
				section: data.section,
				entity_id: data.entity_id,
				image_type: data.image_type,
			};

			const entrySaved = await repository.save(entry);

			await ImageContentRepository.saveContent(
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
		data: DeepPartial<ImageEntity> & { id: number },
	): Promise<ImageEntity> {
		return this.repository.save(data);
	}

	public async updateDataWithContent(
		entry: ImageEntity,
		data: ValidatorOutput<ImageValidator, 'update'>,
	) {
		return dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(ImageEntity);

			Object.assign(entry, pickValuesFromObject(data, paramsUpdateList));

			const updatedEntity = await repository.save(entry);

			if (data.contents) {
				await ImageContentRepository.saveContent(
					manager,
					data.contents,
					entry.id,
				);
			}

			return updatedEntity;
		});
	}

	public async updateStatus(
		entry: ImageEntity,
		newStatus: ImageStatus,
	): Promise<void> {
		assertValidStatusTransition(
			STATUS_TRANSITIONS,
			entry.status,
			newStatus,
		);

		entry.status = newStatus;
		entry.sort_order = 0;

		await this.update(entry);
	}

	public async updateOrder(
		section: ImageSection,
		entity_id: number,
		ids: number[], // Array of IDs in the desired order
	): Promise<void> {
		// We make sure all the available IDs are present in the sorting (eg: ids)
		const count = await this.repository
			.createQuery()
			.filterBy('section', section)
			.filterBy('entity_id', entity_id)
			.filterBy('image_type', ImageTypeEnum.GALLERY)
			.filterBy('status', ImageStatusEnum.ACTIVE)
			.count();

		if (count !== ids.length) {
			throw new BadRequestError(
				lang('image.validation.invalid_ids_provided'),
			);
		}

		await dataSource.transaction(async (manager) => {
			const cases = ids
				.map((id, index) => `WHEN ${id} THEN ${ids.length - index}`)
				.join(' ');

			await manager.query(`
                UPDATE image
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

	public findById(id: number, withDeleted: boolean): Promise<ImageEntity> {
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
		language?: string;
		withDeleted: boolean;
	}) {
		const query = this.repository
			.createQuery()
			.filterById(data.id)
			.withDeleted(data.withDeleted);

		if (data.language) {
			query.joinAndSelect(
				'image.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: data.language,
				},
			);
		} else {
			// No language: take all contents
			query.joinAndSelect('image.contents', 'content', 'LEFT');
		}

		return await query.firstOrFail();
	}

	public findByFilter(
		data: ValidatorOutput<ImageValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.join(
				'image.contents',
				'content',
				'LEFT',
				'content.language = :language',
				{
					language: data.filter.language,
				},
			)
			.select([
				'image.id',
				'image.section',
				'image.entity_id',
				'image.image_type',
				'image.status',
				'image.sort_order',
				'image.created_at',
				'image.updated_at',
				'image.deleted_at',

				'content.language',
				'content.storage',
				'content.path',
				'content.properties',
				'content.attributes',
			])
			.filterById(data.filter.id)
			.filterBy('image.section', data.filter.section)
			.filterBy('image.image_type', data.filter.image_type)
			.filterBy('image.status', data.filter.status)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}
export const imageService = new ImageService(getImageRepository());
