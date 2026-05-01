import type { EntityManager, Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import { BadRequestError, CustomError } from '@/exceptions';
import PlaceEntity, { PlaceTypeEnum } from '@/features/place/place.entity';
import { getPlaceRepository } from '@/features/place/place.repository';
import {
	type PlaceValidator,
	paramsUpdateList,
} from '@/features/place/place.validator';
import PlaceContentRepository from '@/features/place/place-content.repository';
import type { ValidatorOutput } from '@/shared/types/mock.type';
import type { PlaceType } from '@/shared/types/place.type';

export class PlaceService {
	constructor(
		private repository: ReturnType<typeof getPlaceRepository>,
		private getScopedPlaceRepository: (
			manager?: EntityManager,
		) => Repository<PlaceEntity>,
	) {}

	public async checkParentId(
		action: 'create' | 'update',
		place_type: PlaceType,
		parent_id?: number,
	) {
		if (place_type === PlaceTypeEnum.COUNTRY) {
			if (parent_id) {
				throw new BadRequestError(
					lang('place.validation.country_no_parent'),
				);
			}
		} else {
			if (parent_id) {
				const parentEntry = await this.repository
					.createQuery()
					.filterById(parent_id)
					.withDeleted(true)
					.first();

				if (!parentEntry) {
					throw new CustomError(
						409,
						lang('place.error.parent_not_found'),
					);
				}

				switch (place_type) {
					case PlaceTypeEnum.REGION:
						if (parentEntry.place_type !== PlaceTypeEnum.COUNTRY) {
							throw new CustomError(
								409,
								lang('place.error.invalid_parent_type'),
							);
						}
						break;
					case PlaceTypeEnum.CITY:
						if (parentEntry.place_type !== PlaceTypeEnum.REGION) {
							throw new CustomError(
								409,
								lang('place.error.invalid_parent_type'),
							);
						}
						break;
				}
			}
		}

		if (
			action === 'update' &&
			place_type !== PlaceTypeEnum.COUNTRY &&
			!parent_id
		) {
			throw new BadRequestError(lang('place.error.parent_required'));
		}
	}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<PlaceValidator, 'create'>,
	): Promise<PlaceEntity> {
		await this.checkParentId('create', data.place_type, data.parent_id);

		return dataSource.transaction(async (manager) => {
			const repository = this.getScopedPlaceRepository(manager);

			const entry = {
				place_type: data.place_type,
				code: data.code,
				parent_id: data.parent_id,
			};

			const entrySaved = await repository.save(entry);

			await PlaceContentRepository.saveContent(
				manager,
				data.contents,
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
		data: ValidatorOutput<PlaceValidator, 'update'>,
		withDeleted: boolean,
	) {
		const entry = await this.findById(id, withDeleted);

		await this.checkParentId(
			'update',
			data.place_type || entry.place_type,
			data.parent_id || entry.parent_id,
		);

		const isTypeChange =
			data.place_type !== undefined &&
			data.place_type !== entry.place_type;

		if (isTypeChange) {
			const hasChildren = await this.hasChildren(entry.id);

			if (hasChildren) {
				throw new BadRequestError(
					lang('place.error.cannot_change_type_with_children'),
				);
			}
		}

		return dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(PlaceEntity); // We use the manager -> `getPlaceRepository` is not bound to the transaction

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
				await PlaceContentRepository.saveContent(
					manager,
					data.contents,
					id,
				);
			}

			return updatedEntity;
		});
	}

	public async delete(id: number) {
		const hasChildren = await this.hasChildren(id);

		if (hasChildren) {
			throw new BadRequestError(
				lang('place.error.cannot_delete_with_children'),
			);
		}

		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<PlaceEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 */
	public async getDataById(
		id: number,
		data: ValidatorOutput<PlaceValidator, 'read'>,
		withDeleted: boolean,
	) {
		const query = this.repository
			.createQuery()
			.select([
				'place.id',
				'place.place_type',
				'place.code',
				'place.parent_id',
				'place.created_at',
				'place.updated_at',
				'place.deleted_at',
				'content.language',
				'content.name',
				'content.type_label',
			])
			.filterById(id)
			.withDeleted(withDeleted);

		if (data.language) {
			query.joinAndSelect(
				'place.contents',
				'content',
				'INNER',
				'content.language = :language',
				{ language: data.language },
			);
		} else {
			// No language: take all contents
			query.joinAndSelect('place.contents', 'content', 'LEFT');
		}

		return await query.firstOrFail();
	}

	public hasChildren(id: number) {
		return this.repository
			.createQuery()
			.filterBy('parent_id', id)
			.firstRaw();
	}

	public findByFilter(
		data: ValidatorOutput<PlaceValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.join(
				'place.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: data.filter.language,
				},
			)
			.join('place.parent', 'parent', 'LEFT')
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
				'place.id',
				'place.place_type',
				'place.code',
				'place.created_at',
				'place.deleted_at',

				'content.language',
				'content.name',
				'content.type_label',

				'parent.id',
				'parent.place_type',
				'parent.code',

				'parentContent.name',
				'parentContent.type_label',
			])
			.filterById(data.filter.id)
			.filterByTerm(data.filter.term)
			.filterBy('place.place_type', data.filter.place_type)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export function getScopedPlaceRepository(manager?: EntityManager) {
	return (manager ?? dataSource.manager).getRepository(PlaceEntity);
}

export const placeService = new PlaceService(
	getPlaceRepository(),
	getScopedPlaceRepository,
);
