import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { Configuration } from '@/config/settings.config';
import ClientEntity, { ClientTypeEnum } from '@/features/client/client.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ClientQuery extends RepositoryAbstract<ClientEntity> {
	constructor(repository: Repository<ClientEntity>) {
		super(repository, ClientEntity.NAME);
	}

	filterByTerm(term?: string, client_type?: ClientTypeEnum): this {
		if (term) {
			if (!Number.isNaN(Number(term)) && term.trim() !== '') {
				this.filterBy('id', Number(term));
			} else {
				if (
					term.length >
					(Configuration.get('filter.termMinLength') as number)
				) {
					const companyFilters = [
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
					];

					const personFilters = [
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
					];

					switch (client_type) {
						case ClientTypeEnum.COMPANY:
							this.filterAny(companyFilters);
							break;
						case ClientTypeEnum.PERSON:
							this.filterAny(personFilters);
							break;
						default:
							this.filterAny([
								...companyFilters,
								...personFilters,
							]);
							break;
					}
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
