import type { z } from 'zod';
import type ClientEntity from '@/features/client/client.entity';
import {
	ClientStatusEnum,
	ClientTypeEnum,
} from '@/features/client/client.entity';
import {
	clientValidator,
	OrderByEnum,
} from '@/features/client/client.validator';
import { createPastDate, formatDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

type CreateInput = z.input<typeof clientValidator.create>;
type CreateCompanyInput = Extract<
	CreateInput,
	{ client_type: typeof ClientTypeEnum.COMPANY }
>;

export function getClientEntityMock(): ClientEntity {
	return {
		id: 1,
		client_type: ClientTypeEnum.COMPANY,
		status: ClientStatusEnum.ACTIVE,
		company_name: 'Acme Corp',
		company_cui: 'RO123',
		company_reg_com: 'J40/1',
		person_name: null,
		person_identification_number: null,
		iban: null,
		bank_name: null,
		contact_name: 'John',
		contact_email: 'contact@acme.com',
		contact_phone: null,
		notes: null,
		created_at: createPastDate(86400),
		updated_at: null,
		deleted_at: null,
	};
}

export const clientInputPayloads = {
	create: {
		client_type: ClientTypeEnum.COMPANY,
		company_name: 'Acme Corp',
		company_cui: 'RO123',
		company_reg_com: 'J40/1',
		iban: null,
		bank_name: null,
		contact_name: 'John',
		contact_email: 'contact@acme.com',
		contact_phone: null,
		notes: null,
	} as CreateCompanyInput,
	update: {
		client_type: ClientTypeEnum.COMPANY,
		company_name: 'Acme Updated',
		contact_email: 'updated@acme.com',
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'acme',
			client_type: ClientTypeEnum.COMPANY,
			status: ClientStatusEnum.ACTIVE,
			create_date_start: formatDate(createPastDate(14400)),
			create_date_end: formatDate(createPastDate(7200)),
			is_deleted: false,
		},
	},
};

export const clientOutputPayloads = {
	create: clientValidator.create.parse(clientInputPayloads.create),
	update: clientValidator.update.parse(clientInputPayloads.update),
	find: clientValidator.find.parse(clientInputPayloads.find),
};
