import { getClientEntityMock } from '@/features/client/client.mock';
import type ClientAddressEntity from '@/features/client-address/client-address.entity';
import { ClientAddressTypeEnum } from '@/features/client-address/client-address.entity';
import {
	clientAddressValidator,
	OrderByEnum,
} from '@/features/client-address/client-address.validator';
import { createPastDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getClientAddressEntityMock(): ClientAddressEntity {
	return {
		id: 1,
		client_id: 1,
		address_type: ClientAddressTypeEnum.DELIVERY,
		city_id: 1,
		details: 'Str Florio nr 3',
		postal_code: '636231',
		notes: 'The address',
		created_at: createPastDate(28800),
		updated_at: null,
		deleted_at: null,
		client: getClientEntityMock(),
	};
}

export const clientAddressInputPayloads = {
	create: {
		address_type: ClientAddressTypeEnum.DELIVERY,
		city_id: 1,
		details: 'Str Florio nr 3',
		postal_code: '636231',
		notes: 'The address',
	},
	update: {
		address_type: ClientAddressTypeEnum.DELIVERY,
		city_id: 1,
		details: 'Str Florio nr 4',
		postal_code: '636231',
		notes: 'The address -updated',
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'test',
			client_id: 1,
			address_type: ClientAddressTypeEnum.DELIVERY,
			is_deleted: true,
		},
	},
};

export const clientAddressOutputPayloads = {
	create: clientAddressValidator.create.parse(
		clientAddressInputPayloads.create,
	),
	update: clientAddressValidator.update.parse(
		clientAddressInputPayloads.update,
	),
	find: clientAddressValidator.find.parse(clientAddressInputPayloads.find),
};
