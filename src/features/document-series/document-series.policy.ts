import DocumentSeriesEntity from '@/features/document-series/document-series.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class DocumentSeriesPolicy extends PolicyAbstract {
	constructor() {
		const entity = DocumentSeriesEntity.NAME;

		super(entity);
	}
}

export const documentSeriesPolicy = new DocumentSeriesPolicy();
