import {
	isDirectRun,
	type SeedDefinition,
	type SeedSummary,
	topUp,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import DocumentSeriesEntity, {
	type DocumentType,
	DocumentTypeEnum,
} from '@/features/document-series/document-series.entity';

type SeriesRow = {
	document_type: DocumentType;
	code: string;
	padding: number;
	format: string;
};

/** One series per document type, which is what an allocation resolves on */
const SERIES: readonly SeriesRow[] = [
	{
		document_type: DocumentTypeEnum.INVOICE,
		code: 'INV',
		padding: 6,
		format: '{code}-{number}',
	},
	{
		document_type: DocumentTypeEnum.ORDER,
		code: 'ORD',
		padding: 6,
		format: '{code}-{number}',
	},
	{
		document_type: DocumentTypeEnum.GRN,
		code: 'NIR',
		padding: 6,
		format: '{code}-{number}',
	},
	{
		document_type: DocumentTypeEnum.SUBSCRIPTION,
		code: 'S',
		padding: 5,
		format: '{code}{number}',
	},
];

export const documentSeriesSeed: SeedDefinition = {
	name: 'document-series',
	run: async ({ manager }): Promise<SeedSummary> =>
		topUp({
			entity: 'document-series',
			target: SERIES.length,
			manager,
			entityClass: DocumentSeriesEntity,
			// One row per document type, which is also the natural key of the seed
			keyColumn: 'document_type',
			buildRow: (index) => {
				const series = SERIES[index];

				return {
					...series,
					start_number: 1,
					next_number: 1,
				};
			},
		}),
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(documentSeriesSeed);
}
