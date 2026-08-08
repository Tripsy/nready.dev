import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/message.setup';
import { CustomError } from '@/exceptions';
import type TermEntity from '@/features/term/term.entity';
import type { TermType } from '@/features/term/term.entity';
import { getTermRepository } from '@/features/term/term.repository';
import {
	paramsUpdateList,
	type TermValidator,
} from '@/features/term/term.validator';
import { pickValuesFromObject } from '@/helpers/objects.helper';
import type { ValidatorOutput } from '@/shared/types/mock.type';

export class TermService {
	constructor(private repository: ReturnType<typeof getTermRepository>) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<TermValidator, 'create'>,
	): Promise<TermEntity> {
		await this.assertNotDuplicate(data.type, data.language, data.value);

		const entry = {
			type: data.type,
			language: data.language,
			value: data.value,
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<TermEntity> & { id: number },
	): Promise<TermEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		entry: TermEntity,
		data: ValidatorOutput<TermValidator, 'update'>,
	) {
		/*
		 * The natural key is the whole triple, so a change to any one part can collide.
		 * Unspecified parts fall back to the stored row rather than being treated as absent.
		 */
		if (data.type || data.language || data.value) {
			await this.assertNotDuplicate(
				data.type || entry.type,
				data.language || entry.language,
				data.value || entry.value,
				entry.id,
			);
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

	public findById(id: number, withDeleted: boolean): Promise<TermEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByValue(
		type: TermType,
		language: string,
		value: string,
		withoutId?: number,
	) {
		const q = this.repository
			.createQuery()
			.filterBy('type', type)
			.filterBy('language', language)
			.filterBy('value', value);

		if (withoutId) {
			q.filterBy('id', withoutId, '!=');
		}

		return q.first();
	}

	/**
	 * Guards the partial unique index on (type, language, value) so a collision surfaces as a
	 * 409 rather than a driver error. Soft-deleted rows are outside the index and therefore
	 * outside this check — the same value can be recreated after a delete.
	 */
	private async assertNotDuplicate(
		type: TermType,
		language: string,
		value: string,
		withoutId?: number,
	): Promise<void> {
		const existingTerm = await this.findByValue(
			type,
			language,
			value,
			withoutId,
		);

		if (existingTerm) {
			throw new CustomError(409, lang('term.error.already_exists'));
		}
	}

	public findByFilter(
		data: ValidatorOutput<TermValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.filterById(data.filter.id)
			.filterBy('type', data.filter.type)
			.filterBy('language', data.filter.language)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const termService = new TermService(getTermRepository());
