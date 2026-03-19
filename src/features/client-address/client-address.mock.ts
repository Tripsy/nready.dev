import { getClientEntityMock } from '@/features/client/client.mock';
import type ClientAddressEntity from '@/features/client-address/client-address.entity';
import { ClientAddressTypeEnum } from '@/features/client-address/client-address.entity';
import {
	type ClientAddressValidator,
	OrderByEnum,
} from '@/features/client-address/client-address.validator';
import { createPastDate } from '@/helpers';
import { createValidatorPayloads } from '@/helpers/mock.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getClientAddressEntityMock(): ClientAddressEntity {
	return {
		id: 1,
		client_id: 1,
		address_type: ClientAddressTypeEnum.DELIVERY,
		address_city_id: 1,
		address_info: 'Str Florio nr 3',
		address_postal_code: '636231',
		notes: 'The address',
		created_at: createPastDate(28800),
		updated_at: null,
		deleted_at: null,
		client: getClientEntityMock(),
	};
}

export const clientAddressInputPayloads = createValidatorPayloads<
	ClientAddressValidator,
	'create' | 'update' | 'find'
>({
	create: {
		address_type: ClientAddressTypeEnum.DELIVERY,
		address_city_id: 1,
		address_info: 'Str Florio nr 3',
		address_postal_code: '636231',
		notes: 'The address',
	},
	update: {
		address_type: ClientAddressTypeEnum.DELIVERY,
		address_city_id: 1,
		address_info: 'Str Florio nr 4',
		address_postal_code: '636231',
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
});

export const clientAddressOutputPayloads = createValidatorPayloads<
	ClientAddressValidator,
	'find' | 'create',
	'output'
>({
	create: {
		address_type: ClientAddressTypeEnum.DELIVERY,
		address_city_id: 1,
		address_info: 'Str Florio nr 3',
		address_postal_code: '636231',
		notes: 'The address',
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
});
