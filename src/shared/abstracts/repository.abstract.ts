import {
	Brackets,
	type EntityTarget,
	type ObjectLiteral,
	QueryFailedError,
	type Repository,
	type SelectQueryBuilder,
} from 'typeorm';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import { CustomError, NotFoundError } from '@/exceptions';
import {
	type OrderDirection,
	OrderDirectionEnum,
} from '@/shared/abstracts/entity.abstract';

type QueryValue = string | number | (string | number)[] | null;
type QueryParams = Record<string, QueryValue>;

type FilterByPropsType = {
	column: string;
	value?: QueryValue;
	operator: string;
};

abstract class RepositoryAbstract<TEntity extends ObjectLiteral> {
	private repository: Repository<TEntity>;
	protected entity: string;
	protected query: SelectQueryBuilder<TEntity>;
	protected hasFilter: boolean = false; // Flag used to signal if query builder filters have been applied in preparation for delete operations
	protected hasGroup: boolean = false; // Flag used to signal if query builder groups have been applied

	protected constructor(repository: Repository<TEntity>, entity: string) {
		this.repository = repository;
		this.entity = entity;
		this.query = repository.createQueryBuilder(this.entity);
	}

	debugSql(): string {
		return this.query.getSql();
	}

	debugParameters(): ObjectLiteral {
		return this.query.getParameters();
	}

	debug(): this {
		console.debug('SQL:', this.query.getSql());
		console.debug('Parameters:', this.query.getParameters());

		return this;
	}

	join(
		entityOrProperty: string,
		alias: string,
		type: 'INNER' | 'LEFT' = 'INNER',
		condition?: string,
		parameters?: ObjectLiteral,
	): this {
		switch (type) {
			case 'INNER':
				this.query.innerJoin(
					entityOrProperty,
					alias,
					condition,
					parameters,
				);
				break;
			case 'LEFT':
				this.query.leftJoin(
					entityOrProperty,
					alias,
					condition,
					parameters,
				);
				break;
		}

		return this;
	}

	/**
	 * Note: This method automatically selects all related fields (including relations)
	 */
	joinAndSelect(
		entityOrProperty: string,
		alias: string,
		type: 'INNER' | 'LEFT' = 'INNER',
		condition?: string,
		parameters?: ObjectLiteral,
	): this {
		switch (type) {
			case 'INNER':
				this.query.innerJoinAndSelect(
					entityOrProperty,
					alias,
					condition,
					parameters,
				);
				break;
			case 'LEFT':
				this.query.leftJoinAndSelect(
					entityOrProperty,
					alias,
					condition,
					parameters,
				);
				break;
		}

		return this;
	}

	/**
	 * Note: Without primaryKey TypeORM won’t map the entity correctly.
	 *
	 * ex: ['user.id', 'user.name', 'user.email', 'user.status', 'user.created_at', 'user.updated_at']
	 * ex: ['id', 'name', 'email', 'status', 'created_at', 'updated_at']
	 */
	select(fields: string[], autoAppendId: boolean = true): this {
		if (autoAppendId) {
			// Define possible primary key variations
			const primaryKeys = [`${this.entity}.id`, 'id'];

			// Check if either 'id' or 'user.id' is already included
			const hasPrimaryKey = fields.some((field) =>
				primaryKeys.includes(field),
			);

			// If not present, add the fully qualified primary key
			if (!hasPrimaryKey) {
				fields.unshift(`${this.entity}.id`);
			}
		}

		this.query.select(this.prefixFields(fields));

		return this;
	}

	addSelect(fields: string[]) {
		this.query.addSelect(this.prefixFields(fields));

		return this;
	}

	/**
	 * Ensure all fields are prefixed with an entity alias if not add this.entity
	 *
	 * @param fields
	 * @private
	 */
	private prefixFields(fields: string[]) {
		return fields.map((field) =>
			field.includes('.') ? field : `${this.entity}.${field}`,
		);
	}

	private isValidColumn(column: string): boolean {
		// Allow only letters, numbers, underscores dots and cast characters (:)
		const columnPattern = /^[a-zA-Z0-9_.:]+$/;

		return columnPattern.test(column);
	}

	private prepareColumn(column: string): string {
		// Validate or sanitize the column name
		if (!this.isValidColumn(column)) {
			throw new Error(`Invalid column name: ${column}`);
		}

		return column.includes('.') ? column : `${this.entity}.${column}`;
	}

	private safeColumnKey(column: string): string {
		return (
			column
				// Replace all non-alphanumeric characters (except underscore) with _
				.replace(/[^a-zA-Z0-9_]/g, '_')
				// Remove leading/trailing underscores
				.replace(/^_+|_+$/g, '')
				// Ensure it doesn't start with a number
				.replace(/^(\d)/, 'param_$1')
		);
	}

	private buildWhereCondition(
		column: string,
		columnKey: string,
		operator: string,
	): string {
		switch (operator) {
			case 'IN':
				return `${this.prepareColumn(column)} IN (:...${columnKey})`;
			default:
				return `${this.prepareColumn(column)} ${operator} :${columnKey}`;
		}
	}

	/**
	 * Return the ` SelectQueryBuilder ` object so further TypeOrm methods can be chained
	 */
	getQuery(): SelectQueryBuilder<TEntity> {
		return this.query;
	}

	withDeleted(condition: boolean = true) {
		if (condition) {
			this.query.withDeleted();
		}

		return this;
	}

	/**
	 * Note: When using getOne(), TypeORM expects only entity fields to be selected.
	 *       If you manually select raw SQL fields (e.g., COUNT(user.id) as count), getOne() will return null.
	 */
	first() {
		return this.query.getOne();
	}

	firstRaw() {
		return this.query.getRawOne();
	}

	async firstOrFail(isRaw: boolean = false) {
		const result = isRaw ? await this.firstRaw() : await this.first();

		if (!result) {
			throw new NotFoundError(
				lang(
					`${this.entity}.error.not_found`,
					{},
					'Record(s) not found',
				),
			);
		}

		return result;
	}

	orderBy(
		column?: string,
		direction: OrderDirection = OrderDirectionEnum.ASC,
	): this {
		if (column) {
			this.query.addOrderBy(`${this.prepareColumn(column)}`, direction);
		}

		return this;
	}

	groupBy(column: string): this {
		if (column) {
			this.hasGroup = true;

			this.query.addGroupBy(`${this.prepareColumn(column)}`);
		}

		return this;
	}

	pagination(page: number = 1, limit: number = 10): this {
		this.query.skip((page - 1) * limit).take(limit);

		return this;
	}

	all(): Promise<TEntity[]>;
	all(withCount: false): Promise<TEntity[]>;
	all(withCount: true): Promise<[TEntity[], number]>;
	all(
		withCount: boolean = false,
	): Promise<TEntity[]> | Promise<[TEntity[], number]> {
		if (withCount) {
			if (this.hasGroup) {
				throw new CustomError(
					500,
					lang('shared.error.db_select_count_while_using_groups'),
				);
			}

			return this.query.getManyAndCount();
		}

		return this.query.getMany();
	}

	count() {
		return this.query.getCount();
	}

	/**
	 * Used to (soft) delete a single entity or multiple entities
	 * Events will be triggered (ex: beforeRemove for delete, afterSoftRemove for soft delete)
	 *
	 * @param isSoftDelete - if set as `true` will be soft deleted
	 * @param multiple - must be set as `true` to allow multiple entity deletion
	 * @param force - if set as `true` will allow deletion without any proper filter (note: Use with caution!!!)
	 */
	async delete(
		isSoftDelete: boolean = true,
		multiple: boolean = false,
		force: boolean = false,
	): Promise<number> {
		if (!force && !this.hasFilter) {
			throw new CustomError(
				500,
				lang('shared.error.db_delete_missing_filter'),
			);
		}

		return dataSource.transaction(async (manager) => {
			const results = await this.query.getMany();

			if (results.length === 0) {
				throw new NotFoundError(
					lang(
						`${this.entity}.error.not_found`,
						{},
						'Record(s) not found',
					),
				);
			}

			if (!multiple && results.length > 1) {
				throw new CustomError(500, lang('shared.error.db_delete_one'));
			}

			const repo = manager.getRepository<TEntity>(this.repository.target);

			if (isSoftDelete) {
				await Promise.all(
					results.map((entity) => repo.softRemove(entity)),
				);
			} else {
				await Promise.all(results.map((entity) => repo.remove(entity)));
			}

			return results.length;
		});
	}

	async restore(
		multiple: boolean = false,
		force: boolean = false,
	): Promise<number> {
		if (!force && !this.hasFilter) {
			throw new CustomError(
				500,
				lang('shared.error.db_restore_missing_filter'),
			);
		}

		return dataSource.transaction(async (manager) => {
			const results = await this.query.withDeleted().getMany();

			if (results.length === 0) {
				throw new NotFoundError(
					lang(
						`${this.entity}.error.not_found`,
						{},
						'Record(s) not found',
					),
				);
			}

			if (!multiple && results.length > 1) {
				throw new CustomError(500, lang('shared.error.db_restore_one'));
			}

			for (const entity of results) {
				(entity as ObjectLiteral).deleted_at = null;
			}

			const repo = manager.getRepository<TEntity>(this.repository.target);
			await repo.save(results);

			return results.length;
		});
	}

	// Overload: default scalar operators
	filterBy(
		column: string,
		value?: string | number | null,
		operator?: Exclude<string, 'IN'>,
	): this;
	// Overload: IN operator requires array
	filterBy(column: string, value: (string | number)[], operator: 'IN'): this;
	// Implementation
	filterBy(column: string, value?: QueryValue, operator: string = '='): this {
		if (value === undefined || value === null) {
			return this;
		}

		if (operator !== 'IN' && Array.isArray(value)) {
			throw new CustomError(
				500,
				'`value` cannot be an array for operator other than `IN`',
			);
		}

		switch (operator) {
			case '=':
				if (column.endsWith('_id') || column.endsWith('.id')) {
					this.hasFilter = true;
				}
				break;
			case 'IN':
				if (column.endsWith('_id') || column.endsWith('.id')) {
					this.hasFilter = true;
				}
				break;
			case 'LIKE':
			case 'ILIKE':
				value = `%${value}%`;
				break;
			case 'START_LIKE':
			case 'START_ILIKE':
				operator = 'LIKE';
				value = `${value}%`;
				break;
			case 'END_LIKE':
			case 'END_ILIKE':
				operator = 'LIKE';
				value = `%${value}`;
				break;
		}

		const columnKey = this.safeColumnKey(column);

		this.query.andWhere(
			this.buildWhereCondition(column, columnKey, operator),
			{ [columnKey]: value },
		);

		return this;
	}

	filterAny(filters: FilterByPropsType[]): this {
		const conditions: string[] = [];
		const params: QueryParams = {};

		filters.forEach((filter) => {
			if (filter.value === undefined || filter.value === null) {
				return;
			}

			let operator = filter.operator;
			let value = filter.value;

			if (operator !== 'IN' && Array.isArray(value)) {
				throw new CustomError(
					500,
					'`value` cannot be an array for operator other than `IN`',
				);
			}

			switch (operator) {
				case 'LIKE':
				case 'ILIKE':
					value = `%${value}%`;
					break;
				case 'START_LIKE':
				case 'START_ILIKE':
					operator = 'LIKE';
					value = `${value}%`;
					break;
				case 'END_LIKE':
				case 'END_ILIKE':
					operator = 'LIKE';
					value = `%${value}`;
					break;
			}

			const columnKey = this.safeColumnKey(filter.column);

			conditions.push(
				this.buildWhereCondition(filter.column, columnKey, operator),
			);

			params[columnKey] = value;
		});

		if (conditions.length > 0) {
			this.query.andWhere(
				new Brackets((qb) => {
					qb.where(conditions.join(' OR '), params);
				}),
			);
		}

		return this;
	}

	/**
	 * Add a raw SQL filter condition
	 *
	 * @param sql - Raw SQL condition (e.g., "to_tsvector('simple', name) @@ plainto_tsquery('simple', :term)")
	 * @param parameters - Parameters for the SQL condition
	 * @returns this instance for chaining
	 */
	filterRaw(sql: string, parameters: Record<string, QueryValue> = {}): this {
		this.query.andWhere(sql, parameters);

		return this;
	}

	filterByRange(
		column: string,
		min?: Date | number | null,
		max?: Date | number | null,
	): this {
		const minValue = min ?? undefined;
		const maxValue = max ?? undefined;

		if (minValue !== undefined && maxValue !== undefined) {
			const stringColumn = this.safeColumnKey(column);
			const preparedColumn = this.prepareColumn(column);

			this.query.andWhere(
				`${preparedColumn} BETWEEN :min${stringColumn} AND :max${stringColumn}`,
				{
					[`min${stringColumn}`]: minValue,
					[`max${stringColumn}`]: maxValue,
				},
			);
		} else if (minValue !== undefined) {
			this.filterBy(column, minValue as number, '>=');
		} else if (maxValue !== undefined) {
			this.filterBy(column, maxValue as number, '<=');
		}

		return this;
	}

	filterById(id?: number | null) {
		if (id) {
			this.hasFilter = true;
			this.filterBy('id', id);
		}

		return this;
	}

	filterByStatus(status?: string | null) {
		if (status) {
			this.filterBy('status', status);
		}

		return this;
	}

	prepareTsTerm(term: string): string {
		return term.toLowerCase().trim().split(/\s+/).join(' & ');
	}

	static isUniqueViolation(e: unknown): boolean {
		return e instanceof QueryFailedError && e.driverError?.code === '23505';
	}

	static getTreeRepository(entity: EntityTarget<ObjectLiteral>) {
		return dataSource.getTreeRepository(entity);
	}
}

export default RepositoryAbstract;
