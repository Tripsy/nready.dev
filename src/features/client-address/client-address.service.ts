import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { CustomError } from '@/exceptions';
import {
	type ClientService,
	clientService,
} from '@/features/client/client.service';
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
import type { ValidatorOutput } from '@/shared/types/mock.type';
import { PlaceTypeEnum } from '@/shared/types/place.type';

export class ClientAddressService {
	constructor(
		private repository: ReturnType<typeof getClientAddressRepository>,
		private clientService: ClientService,
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
		await this.checkCityId(data.city_id);

		const entry = {
			client_id: client_id,
			address_type: data.address_type,
			city_id: data.city_id,
			details: data.details,
			postal_code: data.postal_code,
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
		const entry = await this.findById(id, withDeleted, client_id); // Returns 404 inside if entry is not found

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
		data: ValidatorOutput<ClientAddressValidator, 'read'>,
		withDeleted: boolean,
		client_id: number,
	) {
		const entry = await this.repository
			.createQuery()
			.filterById(id)
			.filterBy('client_id', client_id)
			.withDeleted(withDeleted)
			.firstOrFail();

		const client = await this.clientService.getDataById(
			entry.client_id,
			withDeleted,
		);

		const address_city = await this.placeService.getDataById(
			entry.city_id,
			data,
			withDeleted,
		);

		return {
			...entry,
			client: client,
			address_city: address_city,
		};
	}

	public findByFilter(
		data: ValidatorOutput<ClientAddressValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.joinAndSelect('client_address.client', 'client', 'INNER')
			.joinAndSelect('client_address.city', 'address_city', 'LEFT')
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
	clientService,
	placeService,
);
