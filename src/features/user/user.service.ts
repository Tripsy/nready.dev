import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import { BadRequestError, CustomError } from '@/exceptions';
import {
	type AccountTokenService,
	accountTokenService,
} from '@/features/account/account-token.service';
import type UserEntity from '@/features/user/user.entity';
import { UserRoleEnum, type UserStatusEnum } from '@/features/user/user.entity';
import { getUserRepository } from '@/features/user/user.repository';
import {
	paramsUpdateList,
	type UserValidator,
} from '@/features/user/user.validator';
import type { ValidatorOutput } from '@/shared/abstracts/validator.abstract';

export class UserService {
	constructor(
		private repository: ReturnType<typeof getUserRepository>,
		private accountTokenService: AccountTokenService,
	) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<UserValidator, 'create'>,
	): Promise<UserEntity> {
		const existing = await this.findByEmail(data.email, true);

		if (existing) {
			throw new CustomError(409, lang('user.error.already_exists'));
		}

		const entry = {
			name: data.name,
			email: data.email,
			password: data.password,
			status: data.status,
			role: data.role,

			...(data.role === UserRoleEnum.OPERATOR &&
				data.operator_type && {
					operator_type: data.operator_type,
				}),

			...(data.language && {
				language: data.language,
			}),
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Used in `register` method from controller;
	 */
	public async createRegister(
		entry: Partial<UserEntity>,
	): Promise<UserEntity> {
		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<UserEntity> & { id: number },
	): Promise<UserEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		data: ValidatorOutput<UserValidator, 'update'>,
		withDeleted: boolean,
	) {
		const entry = await this.findById(id, withDeleted);

		if (data.email) {
			const existing = await this.findByEmail(
				data.email,
				true,
				undefined,
				id,
			);

			if (existing) {
				throw new CustomError(409, lang('user.error.already_exists'));
			}
		}

		if (data.password || data.email !== entry.email) {
			await this.accountTokenService.removeAccountTokenForUser(entry.id); // Note: Removes all account tokens for the user
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
		newStatus: UserStatusEnum,
		withDeleted: boolean,
	): Promise<void> {
		const entry = await this.findById(id, withDeleted);

		if (entry.status === newStatus) {
			throw new BadRequestError(
				lang('user.error.status_unchanged', { status: newStatus }),
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

	public findById(
		id: number,
		withDeleted: boolean = false,
	): Promise<UserEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByEmail(
		email: string,
		withDeleted: boolean,
		fields?: string[],
		excludeId?: number,
	) {
		const q = this.repository
			.createQuery()
			.filterByEmail(email)
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
		data: ValidatorOutput<UserValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.filterById(data.filter.id)
			.filterByStatus(data.filter.status)
			.filterBy('role', data.filter.role)
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

export const userService = new UserService(
	getUserRepository(),
	accountTokenService,
);
