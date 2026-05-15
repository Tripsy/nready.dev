import type { DeepPartial } from 'typeorm';
import {
	type AddressService,
	addressService,
} from '@/features/address/address.service';
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
import type { ValidatorOutput } from '@/shared/types/mock.type';

export class ClientAddressService {
	constructor(
		private repository: ReturnType<typeof getClientAddressRepository>,
		private clientService: ClientService,
		private addressService: AddressService,
	) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<ClientAddressValidator, 'create'>,
		client_id: number,
	): Promise<ClientAddressEntity> {
		const entry = {
			address_type: data.address_type,
			client_id: client_id,
			address_id: data.address_id,
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

		const address = await this.addressService.getDataById(
			entry.address_id,
			data,
			withDeleted,
		);

		return {
			...entry,
			client: client,
			address: address,
		};
	}

	public findByFilter(
		data: ValidatorOutput<ClientAddressValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.joinAndSelect('client_address.client', 'client', 'INNER')
			.joinAndSelect('client_address.address', 'address', 'INNER')
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
	addressService,
);
