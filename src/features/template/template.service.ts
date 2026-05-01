import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { CustomError } from '@/exceptions';
import type TemplateEntity from '@/features/template/template.entity';
import type { TemplateType } from '@/features/template/template.entity';
import { getTemplateRepository } from '@/features/template/template.repository';
import {
	paramsUpdateList,
	type TemplateValidator,
} from '@/features/template/template.validator';
import type { ValidatorOutput } from '@/shared/types/mock.type';

export class TemplateService {
	constructor(private repository: ReturnType<typeof getTemplateRepository>) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<TemplateValidator, 'create'>,
	): Promise<TemplateEntity> {
		const existingTemplate = await this.checkIfExist(
			data.label,
			data.language,
			data.type,
			true,
		);

		if (existingTemplate) {
			throw new CustomError(409, lang('template.error.already_exists'));
		}

		const entry = {
			label: data.label,
			language: data.language,
			type: data.type,
			content: data.content,
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<TemplateEntity> & { id: number },
	): Promise<TemplateEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		data: ValidatorOutput<TemplateValidator, 'update'>,
		withDeleted: boolean,
	) {
		const entry = await this.findById(id, withDeleted);

		const existingTemplate = await this.checkIfExist(
			data.label || entry.label,
			data.language || entry.language,
			data.type || entry.type,
			true,
			undefined,
			id,
		);

		if (existingTemplate) {
			throw new CustomError(409, lang('template.error.already_exists'));
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

	public findById(id: number, withDeleted: boolean): Promise<TemplateEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByLabel(
		label: string,
		language: string,
		type: TemplateType,
		withDeleted: boolean,
	): Promise<TemplateEntity> {
		return this.repository
			.createQuery()
			.filterBy('label', label)
			.filterBy('language', language)
			.filterBy('type', type)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public checkIfExist(
		label: string,
		language: string,
		type: TemplateType,
		withDeleted: boolean,
		fields?: string[],
		excludeId?: number,
	) {
		const q = this.repository
			.createQuery()
			.filterBy('label', label)
			.filterBy('language', language)
			.filterBy('type', type)
			.withDeleted(withDeleted);

		if (excludeId) {
			q.filterBy('id', excludeId, '!=');
		}

		if (fields) {
			q.select(fields);
		}

		return q.first();
	}

	public findByFilter(
		data: ValidatorOutput<TemplateValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.filterById(data.filter.id)
			.filterBy('language', data.filter.language)
			.filterBy('type', data.filter.type)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const templateService = new TemplateService(getTemplateRepository());
