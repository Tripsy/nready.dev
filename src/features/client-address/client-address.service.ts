import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { CustomError } from '@/exceptions';
import type ClientAddressEntity from '@/features/client-address/client-address.entity';
import { getClientAddressRepository } from '@/features/client-address/client-address.repository';
import {
	type ClientAddressValidator,
	paramsUpdateList,
} from '@/features/client-address/client-address.validator';
import {
	type PlaceService,
	placeService,
} from '@/features/place/place.service';
import type { ValidatorOutput } from '@/shared/abstracts/validator.abstract';
import { PlaceTypeEnum } from '@/shared/types/place.type';

export class ClientAddressService {
	constructor(
		private repository: ReturnType<typeof getClientAddressRepository>,
		private placeService: PlaceService,
	) {}

	public async checkAddressCityId(address_city_id?: number) {
		if (address_city_id) {
			const address_city = await this.placeService.findById(
				address_city_id,
				true,
			);

			if (address_city.type !== PlaceTypeEnum.CITY) {
				throw new CustomError(
					409,
					lang('client-address.error.address_city_invalid_type'),
				);
			}
		}
	}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<ClientAddressValidator, 'create'>,
		client_id: number,
	): Promise<ClientAddressEntity> {
		await this.checkAddressCityId(data.address_city_id);

		const entry = {
			client_id: client_id,
			address_type: data.address_type,
			address_city_id: data.address_city_id,
			address_info: data.address_info,
			address_postal_code: data.address_postal_code,
			notes: data.notes,
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<ClientAddressEntity> & { id: number },
	): Promise<ClientAddressEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		data: ValidatorOutput<ClientAddressValidator, 'update'>,
		withDeleted: boolean,
		client_id: number,
	) {
		await this.findById(id, withDeleted, client_id); // Returns 404 inside if entry is not found

		if (data.address_city_id) {
			await this.checkAddressCityId(data.address_city_id);
		}

		const updateData = {
			...Object.fromEntries(
				paramsUpdateList
					.filter((key) => key in data)
					.map((key) => [key, data[key as keyof typeof data]]),
			),
			id,
		};

		return this.update(updateData);
	}

	public async delete(id: number, client_id: number) {
		await this.repository
			.createQuery()
			.filterById(id)
			.filterBy('client_id', client_id)
			.delete();
	}

	public async restore(id: number, client_id: number) {
		await this.repository
			.createQuery()
			.filterById(id)
			.filterBy('client_id', client_id)
			.restore();
	}

	public findById(
		id: number,
		withDeleted: boolean,
		client_id: number,
	): Promise<ClientAddressEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.filterBy('client_id', client_id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 */
	public async getDataById(
		id: number,
		language: string,
		withDeleted: boolean,
		client_id: number,
	) {
		const entry = await this.repository
			.createQuery()
			.filterById(id)
			.filterBy('client_id', client_id)
			.withDeleted(withDeleted)
			.firstOrFail();

		const address_city = await this.placeService.getDataById(
			entry.address_city_id,
			language,
			withDeleted,
		);
		const address_region = address_city.parent_id
			? await this.placeService.getDataById(
					address_city.parent_id,
					language,
					withDeleted,
				)
			: null;
		const address_country = address_region?.parent_id
			? await this.placeService.getDataById(
					address_region.parent_id,
					language,
					withDeleted,
				)
			: null;

		return {
			...entry,
			address_country: address_country,
			address_region: address_region,
			address_city: address_city,
		};
	}

	public findByFilter(
		data: ValidatorOutput<ClientAddressValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()

			.joinAndSelect('client_address.country', 'country', 'LEFT')
			.joinAndSelect(
				'country.contents',
				'countryContent',
				'LEFT',
				'countryContent.language = :language',
				{
					language: data.filter.language,
				},
			)

			.joinAndSelect('client_address.region', 'region', 'LEFT')
			.joinAndSelect(
				'region.contents',
				'regionContent',
				'LEFT',
				'regionContent.language = :language',
				{
					language: data.filter.language,
				},
			)

			.joinAndSelect('client_address.city', 'city', 'LEFT')
			.joinAndSelect(
				'city.contents',
				'cityContent',
				'LEFT',
				'cityContent.language = :language',
				{
					language: data.filter.language,
				},
			)

			.select([
				'client_address.id',
				'client_address.address_type',
				'client_address.address_info',
				'client_address.address_postal_code',
				'client_address.notes',
				'client_address.created_at',
				'client_address.updated_at',
				'client_address.deleted_at',

				'client_address.address_country_id',
				'countryContent.name AS address_country',

				'client_address.address_region_id',
				'regionContent.name AS address_region',

				'client_address.address_city_id',
				'cityContent.name AS address_city',
			])
			.filterById(data.filter.id)
			.filterBy('client_address.client_id', data.filter.client_id)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const clientAddressService = new ClientAddressService(
	getClientAddressRepository(),
	placeService,
);
