import type { DeepPartial } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { BadRequestError } from '@/exceptions';
import ImageEntity, {
	type ImageSection,
	type ImageStatus,
	ImageTypeEnum,
	STATUS_TRANSITIONS,
} from '@/features/image/image.entity';
import { getImageRepository } from '@/features/image/image.repository';
import type { ImageValidator } from '@/features/image/image.validator';
import ImageContentRepository from '@/features/image/image-content.repository';
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
				storage: data.storage,
				path: data.path,
				properties: data.properties,
				sort_order: data.sort_order,
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
		await dataSource.transaction(async (manager) => {
			await ImageContentRepository.saveContent(
				manager,
				data.contents,
				entry.id,
			);
		});

		return entry;
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
		positions: { id: number; sort_order: number }[],
	): Promise<void> {
		const ids = positions.map((p) => p.id);

		if (ids.length === 0) {
			return;
		}

		await dataSource.transaction(async (manager) => {
			const imageRepository = manager.getRepository(ImageEntity);

			// Load all images with ownership check in one query
			const images = await imageRepository
				.createQueryBuilder('image')
				.where('image.id IN (:...ids)', { ids })
				.andWhere('image.section = :section', { section })
				.andWhere('image.entity_id = :entity_id', { entity_id })
				.andWhere('image.image_type = :imageType', {
					imageType: ImageTypeEnum.GALLERY,
				})
				.getMany();

			// Validate all images exist and belong to this entity
			const foundIds = new Set(images.map((img) => img.id));
			const allFound = ids.every((id) => foundIds.has(id));

			if (!allFound) {
				const missingIds = ids.filter((id) => !foundIds.has(id));

				throw new BadRequestError(
					`Invalid image IDs: ${missingIds.join(', ')}`,
				);
			}

			// Update sort_order
			const updatedImages = images.map((image) => {
				const position = positions.find((p) => p.id === image.id);

				if (position) {
					image.sort_order = position.sort_order;
				}

				return image;
			});

			// Save all - triggers subscribers
			await imageRepository.save(updatedImages);
		});
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete(false);
	}

	public findById(id: number): Promise<ImageEntity> {
		return this.repository.createQuery().filterById(id).firstOrFail();
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 */
	public async getEntryData(data: { id: number; language?: string }) {
		const query = this.repository.createQuery().filterById(data.id);

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

	public findByFilter(data: ValidatorOutput<ImageValidator, 'find'>) {
		const query = this.repository
			.createQuery()
			.join('image.contents', 'content', 'LEFT')
			.select([
				'image.id',
				'image.section',
				'image.entity_id',
				'image.image_type',
				'image.storage',
				'image.path',
				'image.properties',
				'image.status',
				'image.sort_order',
				'image.created_at',
				'image.updated_at',

				'content.id',
				'content.language',
				'content.title',
				'content.description',
			])
			.filterById(data.filter.id)
			.filterBy('image.entity_id', data.filter.entity_id)
			.filterBy('image.section', data.filter.section)
			.filterBy('image.image_type', data.filter.image_type)
			.filterBy('image.status', data.filter.status)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit);

		if (data.filter.language) {
			query.filterBy('content.language', data.filter.language);
		}

		return query.all(true);
	}
}
export const imageService = new ImageService(getImageRepository());
