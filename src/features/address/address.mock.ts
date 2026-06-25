import type AddressEntity from '@/features/address/address.entity';
import {
	addressValidator,
	OrderByEnum,
} from '@/features/address/address.validator';
import { createPastDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getAddressEntityMock(): AddressEntity {
	return {
		id: 1,
		city_id: 1,
		details: 'Str Florio nr 3',
		postal_code: '636231',
		created_at: createPastDate(28800),
		updated_at: null,
		deleted_at: null,
	};
}

export const addressInputPayloads = {
	create: {
		city_id: 1,
		details: 'Str Florio nr 3',
		postal_code: '636231',
	},
	update: {
		id: 1,
		city_id: 1,
		details: 'Str Florio nr 4',
		postal_code: '636231',
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'test',
			is_deleted: true,
		},
	},
};

export const addressOutputPayloads = {
	create: addressValidator.create.parse(addressInputPayloads.create),
	update: addressValidator.update.parse(addressInputPayloads.update),
	find: addressValidator.find.parse(addressInputPayloads.find),
};
