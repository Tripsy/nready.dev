import type DocumentSeriesEntity from '@/features/document-series/document-series.entity';
import { DocumentTypeEnum } from '@/features/document-series/document-series.entity';
import {
	DocumentSeriesValidator,
	OrderByEnum,
} from '@/features/document-series/document-series.validator';
import { createPastDate } from '@/helpers/date.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

const documentSeriesValidator = new DocumentSeriesValidator('document-series');

export function getDocumentSeriesEntityMock(): DocumentSeriesEntity {
	return {
		id: 1,
		document_type: DocumentTypeEnum.INVOICE,
		code: 'INV',
		year: 2026,
		start_number: 1,
		next_number: 42,
		padding: 4,
		format: '{code}-{year}-{number}',
		notes: null,
		created_at: createPastDate(86400),
		updated_at: createPastDate(43200),
	};
}

export const documentSeriesInputPayloads = {
	create: {
		document_type: DocumentTypeEnum.INVOICE,
		code: 'INV',
		year: 2026,
		start_number: 1,
		padding: 4,
		format: '{code}-{year}-{number}',
		notes: 'Fiscal invoice series',
	},
	update: {
		id: 1,
		code: 'INV',
		padding: 5,
		format: '{code}-{year}-{number}',
		notes: 'Fiscal invoice series',
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'INV',
			document_type: DocumentTypeEnum.INVOICE,
			year: 2026,
		},
	},
};

export const documentSeriesOutputPayloads = {
	create: documentSeriesValidator.create.parse(
		documentSeriesInputPayloads.create,
	),
	update: documentSeriesValidator.update.parse(
		documentSeriesInputPayloads.update,
	),
	find: documentSeriesValidator.find.parse(documentSeriesInputPayloads.find),
};
