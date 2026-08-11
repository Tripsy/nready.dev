import type { DeepPartial, EntityManager } from 'typeorm';
import { lang } from '@/config/message.setup';
import { BadRequestError } from '@/exceptions';
import type { DocumentType } from '@/features/document-series/document-series.entity';
import DocumentSeriesEntity, {
	YEAR_CONTINUOUS,
} from '@/features/document-series/document-series.entity';
import {
	createDocumentSeriesQuery,
	getDocumentSeriesRepository,
} from '@/features/document-series/document-series.repository';
import {
	type DocumentSeriesValidator,
	paramsUpdateList,
} from '@/features/document-series/document-series.validator';
import { pickValuesFromObject } from '@/helpers/objects.helper';
import type { ValidatorOutput } from '@/shared/types/mock.type';

export type AllocateParams = {
	document_type: DocumentType;
	/** Document date, for a back-dated document that belongs to an earlier year's series */
	at?: Date;
};

export type AllocatedReference = {
	code: string;
	year: number;
	number: number;
	/** `format` rendered with the allocated number, e.g. `INV-2026-0001` */
	reference: string;
};

/** Postgres unique violation — two transactions rolling the same series into a new year */
const UNIQUE_VIOLATION = '23505';

export class DocumentSeriesService {
	constructor(
		private repository: ReturnType<typeof getDocumentSeriesRepository>,
	) {}

	/**
	 * @description Hand out the next number of a document type's series.
	 *
	 * Takes the caller's `manager` so the counter moves in the same transaction as the document
	 * insert: a failed insert rolls the number back and the series stays gapless, which is the
	 * whole reason this is not a Postgres sequence. A concurrent allocation blocks on the row
	 * lock the UPDATE takes until that transaction ends.
	 *
	 * ```ts
	 * await dataSource.transaction(async (manager) => {
	 *   const ref = await documentSeriesService.allocate(manager, {
	 *     document_type: DocumentTypeEnum.INVOICE,
	 *     at: data.issued_at,
	 *   });
	 *
	 *   return manager.getRepository(InvoiceEntity).save({
	 *     ...entry,
	 *     ref_code: ref.code,
	 *     ref_number: ref.number,
	 *   });
	 * });
	 * ```
	 */
	public async allocate(
		manager: EntityManager,
		params: AllocateParams,
	): Promise<AllocatedReference> {
		const series = await this.resolveSeries(manager, params);

		// A single statement rather than SELECT … FOR UPDATE + UPDATE: it takes the same row
		// lock, cannot read a value it then fails to claim, and stays one round trip.
		// Raw on purpose — a counter bump is not a business update and has no history entry.
		// TypeORM hands back `[rows, affectedCount]` for a write, not a bare row array
		const [rows]: [Array<{ number: number }>, number] = await manager.query(
			`UPDATE "document_series"
			 SET "next_number" = "next_number" + 1, "updated_at" = now()
			 WHERE "id" = $1
			 RETURNING "next_number" - 1 AS "number"`,
			[series.id],
		);

		const allocated = rows[0];

		if (!allocated) {
			// The row was deleted between the lookup and the update
			throw new BadRequestError(
				lang('document-series.error.not_allocatable', {
					document_type: series.document_type,
				}),
			);
		}

		const number = Number(allocated.number);

		return {
			code: series.code,
			year: series.year,
			number,
			reference: formatReference(series, number),
		};
	}

	/**
	 * The series row the allocation belongs to, creating the next year's row when a yearly series
	 * has rolled over. Only `year > 0` resets; a continuous series is used as it stands.
	 */
	private async resolveSeries(
		manager: EntityManager,
		params: AllocateParams,
	): Promise<DocumentSeriesEntity> {
		const latest = await this.findLatestSeries(
			manager,
			params.document_type,
		);

		if (latest.year === YEAR_CONTINUOUS) {
			return latest;
		}

		const targetYear = (params.at ?? new Date()).getFullYear();

		if (latest.year === targetYear) {
			return latest;
		}

		const existing = await createDocumentSeriesQuery(manager)
			.filterBy('document_type', params.document_type)
			.filterBy('year', targetYear)
			.first();

		if (existing) {
			return existing;
		}

		return this.openYear(manager, latest, targetYear);
	}

	/**
	 * The newest row of the document type's series, which doubles as the template a new year is
	 * cloned from. Ordered by year so a series that has run for several years resolves to the
	 * current definition rather than the one it started with.
	 */
	private async findLatestSeries(
		manager: EntityManager,
		documentType: DocumentType,
	): Promise<DocumentSeriesEntity> {
		const series = await createDocumentSeriesQuery(manager)
			.filterBy('document_type', documentType)
			.orderBy('year', 'DESC')
			.first();

		if (!series) {
			throw new BadRequestError(
				lang('document-series.error.not_configured', {
					document_type: documentType,
				}),
			);
		}

		return series;
	}

	/**
	 * Clone a series into a new year, carrying its configuration over and restarting the counter.
	 * Two documents issued at the same moment on 1 January race here; the unique key decides and
	 * the loser reads the winner's row.
	 */
	private async openYear(
		manager: EntityManager,
		template: DocumentSeriesEntity,
		year: number,
	): Promise<DocumentSeriesEntity> {
		try {
			return await manager.getRepository(DocumentSeriesEntity).save({
				document_type: template.document_type,
				code: template.code,
				year,
				start_number: template.start_number,
				next_number: template.start_number,
				padding: template.padding,
				format: template.format,
				notes: template.notes,
			});
		} catch (error) {
			if (
				!(
					error instanceof Error &&
					(error as { driverError?: { code?: string } }).driverError
						?.code === UNIQUE_VIOLATION
				)
			) {
				throw error;
			}

			return createDocumentSeriesQuery(manager)
				.filterBy('document_type', template.document_type)
				.filterBy('year', year)
				.firstOrFail();
		}
	}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<DocumentSeriesValidator, 'create'>,
	): Promise<DocumentSeriesEntity> {
		return this.repository.save({
			document_type: data.document_type,
			code: data.code,
			year: data.year,
			start_number: data.start_number,
			// A brand-new series has issued nothing, so the next number is the first one
			next_number: data.start_number,
			padding: data.padding,
			format: data.format,
			notes: data.notes ?? null,
		});
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<DocumentSeriesEntity> & { id: number },
	): Promise<DocumentSeriesEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		entry: DocumentSeriesEntity,
		data: ValidatorOutput<DocumentSeriesValidator, 'update'>,
	): Promise<DocumentSeriesEntity> {
		Object.assign(entry, pickValuesFromObject(data, paramsUpdateList));

		return this.update(entry);
	}

	/**
	 * Hard delete: the table has no `deleted_at`, and a series that has issued numbers should be
	 * left in place rather than removed — its `(document_type, year)` key is what the next
	 * allocation continues from.
	 */
	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete(false);
	}

	public findById(id: number): Promise<DocumentSeriesEntity> {
		return this.repository.createQuery().filterById(id).firstOrFail();
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 */
	public async getEntryData(data: { id: number }) {
		return await this.repository
			.createQuery()
			.select(SELECT_COLUMNS)
			.filterById(data.id)
			.firstOrFail();
	}

	public findByFilter(
		data: ValidatorOutput<DocumentSeriesValidator, 'find'>,
	) {
		return this.repository
			.createQuery()
			.select(SELECT_COLUMNS)
			.filterById(data.filter.id)
			.filterBy('document_type', data.filter.document_type)
			.filterBy('year', data.filter.year)
			.filterByTerm(data.filter.term)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

const SELECT_COLUMNS = [
	'document_series.id',
	'document_series.document_type',
	'document_series.code',
	'document_series.year',
	'document_series.start_number',
	'document_series.next_number',
	'document_series.padding',
	'document_series.format',
	'document_series.notes',
	'document_series.created_at',
	'document_series.updated_at',
];

/**
 * Render a series' template. Exported so a caller holding `ref_code` / `ref_number` can rebuild
 * the display reference without allocating anything.
 */
export function formatReference(
	series: Pick<DocumentSeriesEntity, 'code' | 'year' | 'padding' | 'format'>,
	number: number,
): string {
	return series.format
		.replace('{code}', series.code)
		.replace(
			'{year}',
			series.year === YEAR_CONTINUOUS ? '' : String(series.year),
		)
		.replace('{number}', String(number).padStart(series.padding, '0'));
}

export const documentSeriesService = new DocumentSeriesService(
	getDocumentSeriesRepository(),
);
