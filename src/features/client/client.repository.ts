import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import ClientEntity from '@/features/client/client.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ClientQuery extends RepositoryAbstract<ClientEntity> {
	constructor(repository: Repository<ClientEntity>) {
		super(repository, ClientEntity.NAME);
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
							column: 'company_name',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'company_cui',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'company_reg_com',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'person_name',
							value: term,
							operator: 'ILIKE',
						},
						{
							column: 'person_identification_number',
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

export const getClientRepository = () =>
	dataSource.getRepository(ClientEntity).extend({
		createQuery() {
			return new ClientQuery(this);
		},
	});
