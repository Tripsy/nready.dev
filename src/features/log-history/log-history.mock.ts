import { RequestContextSourceEnum } from '@/config/request.context';
import type LogHistoryEntity from '@/features/log-history/log-history.entity';
import {
	logHistoryValidator,
	OrderByEnum,
} from '@/features/log-history/log-history.validator';
import { createPastDate, formatDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { LogHistoryActionEnum } from '@/shared/types/log-history.type';

export function getLogHistoryEntityMock(): LogHistoryEntity {
	return {
		id: 1,
		entity: 'user',
		entity_id: 1,
		action: LogHistoryActionEnum.CREATED,
		auth_id: 1,
		performed_by: 'Gabriel',
		request_id: 'xxx',
		source: RequestContextSourceEnum.API,
		recorded_at: createPastDate(28800),
	};
}

export const logHistoryInputPayloads = {
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			entity: 'test',
			entity_id: 1,
			action: 'create',
			request_id: 'xxx',
			source: RequestContextSourceEnum.API,
			recorded_at_start: formatDate(createPastDate(14400)),
			recorded_at_end: formatDate(createPastDate(7200)),
		},
	},
	delete: { ids: [1, 2, 3] },
};

export const logHistoryOutputPayloads = {
	find: logHistoryValidator.find.parse(logHistoryInputPayloads.find),
};
