import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { CustomError } from '@/exceptions';
import type CarrierEntity from '@/features/carrier/carrier.entity';
import { getCarrierRepository } from '@/features/carrier/carrier.repository';
import {
	type CarrierValidator,
	paramsUpdateList,
} from '@/features/carrier/carrier.validator';
import { pickValuesFromObject } from '@/helpers';
import type { ValidatorOutput } from '@/shared/types/mock.type';

export class CarrierService {
	constructor(private repository: ReturnType<typeof getCarrierRepository>) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<CarrierValidator, 'create'>,
	): Promise<CarrierEntity> {
		const existingCarrier = await this.findByName(data.name);

		if (existingCarrier) {
			throw new CustomError(409, lang('carrier.error.name_already_used'));
		}

		const entry = {
			name: data.name,
			website: data.website,
			phone: data.phone,
			email: data.email,
			notes: data.notes,
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<CarrierEntity> & { id: number },
	): Promise<CarrierEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		entry: CarrierEntity,
		data: ValidatorOutput<CarrierValidator, 'update'>,
	) {
		if (data.name) {
			const existingCarrier = await this.findByName(data.name, entry.id);

			if (existingCarrier) {
				throw new CustomError(
					409,
					lang('carrier.error.name_already_used'),
				);
			}
		}

		Object.assign(entry, pickValuesFromObject(data, paramsUpdateList));

		return this.update(entry);
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<CarrierEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByName(name: string, withoutId?: number) {
		const q = this.repository.createQuery().filterBy('name', name);

		if (withoutId) {
			q.filterBy('id', withoutId, '!=');
		}

		return q.first();
	}

	public findByFilter(
		data: ValidatorOutput<CarrierValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.filterById(data.filter.id)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const carrierService = new CarrierService(getCarrierRepository());
