import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { CustomError } from '@/exceptions';
import type AddressEntity from '@/features/address/address.entity';
import { getAddressRepository } from '@/features/address/address.repository';
import {
	type AddressValidator,
	paramsUpdateList,
} from '@/features/address/address.validator';
import {
	type PlaceService,
	placeService,
} from '@/features/place/place.service';
import type { ValidatorOutput } from '@/shared/types/mock.type';
import { PlaceTypeEnum } from '@/shared/types/place.type';

export class AddressService {
	constructor(
		private repository: ReturnType<typeof getAddressRepository>,
		private placeService: PlaceService,
	) {}

	public async checkCityId(city_id?: number) {
		if (city_id) {
			const address_city = await this.placeService.findById(
				city_id,
				true,
			);

			if (address_city.place_type !== PlaceTypeEnum.CITY) {
				throw new CustomError(
					409,
					lang('address.error.address_city_invalid_type'),
				);
			}
		}
	}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<AddressValidator, 'create'>,
	): Promise<AddressEntity> {
		await this.checkCityId(data.city_id);

		const entry = {
			city_id: data.city_id,
			details: data.details,
			postal_code: data.postal_code,
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<AddressEntity> & { id: number },
	): Promise<AddressEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		data: ValidatorOutput<AddressValidator, 'update'>,
		withDeleted: boolean,
	) {
		const entry = await this.findById(id, withDeleted); // Returns 404 inside if entry is not found

		if (data.city_id) {
			await this.checkCityId(data.city_id);
		}

		Object.assign(
			entry,
			Object.fromEntries(
				paramsUpdateList
					.filter((key) => key in data)
					.map((key) => [key, data[key as keyof typeof data]]),
			),
		);

		return this.update(entry);
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<AddressEntity> {
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
		data: ValidatorOutput<AddressValidator, 'read'>,
		withDeleted: boolean,
	) {
		const entry = await this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();

		const address_city = await this.placeService.getDataById(
			entry.city_id,
			data,
			withDeleted,
		);

		return {
			...entry,
			address_city: address_city,
		};
	}

	public findByFilter(
		data: ValidatorOutput<AddressValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.joinAndSelect('address.city', 'address_city', 'LEFT')
			.joinAndSelect(
				'address_city.contents',
				'address_city_content',
				'LEFT',
				'address_city_content.language = :language',
				{
					language: data.filter.language,
				},
			)
			.filterById(data.filter.id)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const addressService = new AddressService(
	getAddressRepository(),
	placeService,
);
