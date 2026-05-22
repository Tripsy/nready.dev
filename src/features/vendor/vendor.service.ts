import type { DeepPartial } from 'typeorm';
import type VendorEntity from '@/features/vendor/vendor.entity';
import {
	STATUS_TRANSITIONS,
	type VendorStatus,
} from '@/features/vendor/vendor.entity';
import { getVendorRepository } from '@/features/vendor/vendor.repository';
import {
	paramsUpdateList,
	type VendorValidator,
} from '@/features/vendor/vendor.validator';
import { assertValidStatusTransition } from '@/shared/abstracts/service.abstract';
import type { ValidatorOutput } from '@/shared/types/mock.type';

export class VendorService {
	constructor(private repository: ReturnType<typeof getVendorRepository>) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<VendorValidator, 'create'>,
	): Promise<VendorEntity> {
		const entry = {
			name: data.name,
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<VendorEntity> & { id: number },
	): Promise<VendorEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		data: ValidatorOutput<VendorValidator, 'update'>,
		withDeleted: boolean,
	) {
		const entry = await this.findById(id, withDeleted); // Returns 404 inside if entry is not found

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

	public async updateStatus(
		id: number,
		newStatus: VendorStatus,
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

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<VendorEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 */
	public async getDataById(id: number, withDeleted: boolean) {
		return await this.repository
			.createQuery()
			.select([
				'vendor.id',
				'vendor.name',
				'vendor.status',
				'vendor.created_at',
				'vendor.updated_at',
				'vendor.deleted_at',
			])
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByFilter(
		data: ValidatorOutput<VendorValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.select([
				'vendor.id',
				'vendor.name',
				'vendor.status',
				'vendor.created_at',
				'vendor.updated_at',
				'vendor.deleted_at',
			])
			.filterById(data.filter.id)
			.filterBy('status', data.filter.status)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const vendorService = new VendorService(getVendorRepository());
