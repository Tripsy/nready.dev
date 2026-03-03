import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class CashFlowQuery extends RepositoryAbstract<CashFlowEntity> {
	constructor(repository: Repository<CashFlowEntity>) {
		super(repository, CashFlowEntity.NAME);
	}

	filterByTerm(term?: string): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (
					term.length >
					(Configuration.get('filter.termMinLength') as number)
				) {
					this.filterAny([
						{
							column: 'notes',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'external_reference',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'transaction_id',
							value: term,
							operator: 'ILIKE',
						},
					]);
				}
			}
		}

		return this;
	}
}

export const getCashFlowRepository = () =>
	dataSource.getRepository(CashFlowEntity).extend({
		createQuery() {
			return new CashFlowQuery(this);
		},
	});
