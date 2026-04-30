import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { CustomError } from '@/exceptions';
import type ClientEntity from '@/features/client/client.entity';
import {
	type ClientIdentityData,
	type ClientStatus,
	ClientStatusEnum,
	ClientTypeEnum,
	STATUS_TRANSITIONS,
} from '@/features/client/client.entity';
import { getClientRepository } from '@/features/client/client.repository';
import {
	type ClientValidator,
	paramsUpdateList,
} from '@/features/client/client.validator';
import type { ValidatorOutput } from '@/shared/types/mock.type';
import { assertValidStatusTransition } from '@/shared/abstracts/service.abstract';

export class ClientService {
	constructor(private repository: ReturnType<typeof getClientRepository>) {}

	public async checkDuplicate(data: ClientIdentityData, exclude_id?: number) {
		const query = this.repository
			.createQuery()
			.filterBy('client_type', data.client_type);

		if (exclude_id) {
			query.filterBy('id', exclude_id, '!=');
		}

		if (data.client_type === ClientTypeEnum.COMPANY) {
			// `company_cui` is usually required but we do the check anyway
			if (
				!data.company_name &&
				!data.company_cui &&
				!data.company_reg_com
			) {
				return;
			}

			query.filterAny([
				{
					column: 'company_name',
					value: data.company_name,
					operator: '=',
				},
				{
					column: 'company_cui',
					value: data.company_cui,
					operator: '=',
				},
				{
					column: 'company_reg_com',
					value: data.company_reg_com,
					operator: '=',
				},
			]);
		} else {
			// if `person_identification_number` is not present the check doesn't make sense
			if (!data.person_identification_number) {
				return;
			}

			query.filterBy(
				'person_identification_number',
				data.person_identification_number,
			);
		}

		query.withDeleted();

		if ((await query.count()) > 0) {
			throw new CustomError(409, lang('client.error.already_exists'));
		}
	}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<ClientValidator, 'create'>,
	): Promise<ClientEntity> {
		const identityData: ClientIdentityData =
			data.client_type === ClientTypeEnum.COMPANY
				? {
						client_type: ClientTypeEnum.COMPANY,
						company_name: data.company_name,
						company_cui: data.company_cui,
						company_reg_com: data.company_reg_com,
					}
				: {
						client_type: ClientTypeEnum.PERSON,
						person_identification_number:
							data.person_identification_number,
					};

		await this.checkDuplicate(identityData);

		const entry = {
			...data,
			status: ClientStatusEnum.ACTIVE,
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<ClientEntity> & { id: number },
	): Promise<ClientEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		data: ValidatorOutput<ClientValidator, 'update'>,
	) {
		const identityData: ClientIdentityData =
			data.client_type === ClientTypeEnum.COMPANY
				? {
						client_type: ClientTypeEnum.COMPANY,
						company_name: data.company_name,
						company_cui: data.company_cui,
						company_reg_com: data.company_reg_com,
					}
				: {
						client_type: ClientTypeEnum.PERSON,
						person_identification_number:
							data.person_identification_number,
					};

		await this.checkDuplicate(identityData, id);

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

	public async updateStatus(
		id: number,
		newStatus: ClientStatus,
		withDeleted: boolean,
	): Promise<void> {
		const entry = await this.findById(id, withDeleted);

		assertValidStatusTransition(
			STATUS_TRANSITIONS,
			entry.status,
			newStatus,
		);

		entry.status = newStatus;

		await this.repository.save(entry);
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<ClientEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public async getDataById(id: number, withDeleted: boolean) {
		const entry = await this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();

		if (entry.client_type === ClientTypeEnum.COMPANY) {
			delete entry.person_name;
			delete entry.person_identification_number;
		} else {
			delete entry.company_name;
			delete entry.company_cui;
			delete entry.company_reg_com;
		}

		return entry;
	}

	public findByFilter(
		data: ValidatorOutput<ClientValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.filterById(data.filter.id)
			.filterBy('client_type', data.filter.client_type)
			.filterByStatus(data.filter.status)
			.filterByRange(
				'created_at',
				data.filter.create_at_start,
				data.filter.create_at_end,
			)
			.filterByTerm(data.filter.term, data.filter.client_type)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const clientService = new ClientService(getClientRepository());
