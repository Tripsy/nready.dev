import type { DeepPartial } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import { BadRequestError, CustomError, NotFoundError } from '@/exceptions';
import type ClientEntity from '@/features/client/client.entity';
import {
	type ClientIdentityData,
	ClientStatusEnum,
	ClientTypeEnum,
} from '@/features/client/client.entity';
import { getClientRepository } from '@/features/client/client.repository';
import {
	type ClientValidator,
	paramsUpdateList,
} from '@/features/client/client.validator';
import type { ValidatorOutput } from '@/shared/abstracts/validator.abstract';

export class ClientService {
	constructor(private repository: ReturnType<typeof getClientRepository>) {}

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
						person_cnp: data.person_cnp,
					};

		const isDuplicate =
			await this.repository.isDuplicateIdentity(identityData);

		if (isDuplicate) {
			throw new CustomError(409, lang('client.error.already_exists'));
		}

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
		_withDeleted: boolean = true,
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
						person_cnp: data.person_cnp,
					};

		const isDuplicate = await this.repository.isDuplicateIdentity(
			identityData,
			id,
		);

		if (isDuplicate) {
			throw new CustomError(409, lang('client.error.already_exists'));
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

	public async updateStatus(
		id: number,
		newStatus: ClientStatusEnum,
		withDeleted: boolean,
	): Promise<void> {
		const entry = await this.findById(id, withDeleted);

		if (entry.status === newStatus) {
			throw new BadRequestError(
				lang('client.error.status_unchanged', { status: newStatus }),
			);
		}

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

	public async getDataById(
		id: number,
		language: string,
		withDeleted: boolean,
	) {
		const clientEntryQuery = dataSource
			.createQueryBuilder()
			.select([
				'c.*',
				'pcoCountry.name AS address_country',
				'preRegion.name AS address_region',
				'pciCity.name AS address_city',
			])
			.from('client', 'c')
			// Address country
			.leftJoin('place', 'pco', 'pco.id = c.address_country')
			.leftJoin(
				'place_content',
				'pcoCountry',
				'pcoCountry.place_id = pco.id AND pcoCountry.language = :language',
				{ language: language },
			)
			// Address region
			.leftJoin('place', 'pre', 'pre.id = c.address_region')
			.leftJoin(
				'place_content',
				'preRegion',
				'preRegion.place_id = pre.id AND preRegion.language = :language',
				{ language: language },
			)
			// Address city
			.leftJoin('place', 'pci', 'pci.id = c.address_city')
			.leftJoin(
				'place_content',
				'pciCity',
				'pciCity.place_id = pci.id AND pciCity.language = :language',
				{ language: language },
			)
			.where('c.id = :id', { id: id });

		if (withDeleted) {
			clientEntryQuery.withDeleted();
		}

		const clientEntry = await clientEntryQuery.getRawOne();

		if (!clientEntry) {
			throw new NotFoundError(lang('client.error.not_found'));
		}

		if (clientEntry.client_type === ClientTypeEnum.COMPANY) {
			delete clientEntry.person_name;
			delete clientEntry.person_cnp;
		} else {
			delete clientEntry.company_name;
			delete clientEntry.company_cui;
			delete clientEntry.company_reg_com;
		}

		return clientEntry;
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
				data.filter.create_date_start,
				data.filter.create_date_end,
			)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const clientService = new ClientService(getClientRepository());
