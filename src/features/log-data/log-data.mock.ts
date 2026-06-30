import type LogDataEntity from '@/features/log-data/log-data.entity';
import { LogDataCategoryEnum } from '@/features/log-data/log-data.entity';
import {
	LogDataValidator,
	OrderByEnum,
} from '@/features/log-data/log-data.validator';
import { createPastDate, formatDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { LogDataLevelEnum } from '@/shared/types/log-data.type';

export function getLogDataEntityMock(): LogDataEntity {
	return {
		id: 1,
		pid: 'yyy',
		request_id: 'xxx',
		category: 'system',
		level: LogDataLevelEnum.ERROR,
		message: 'Lorem ipsum',
		context: undefined,
		created_at: createPastDate(28800),
	};
}

export const logDataInputPayloads = {
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			id: 1,
			category: LogDataCategoryEnum.SYSTEM,
			level: LogDataLevelEnum.ERROR,
			create_at_start: formatDate(createPastDate(14400)),
			create_at_end: formatDate(createPastDate(7200)),
			term: 'timeout',
		},
	},
	delete: { ids: [1, 2, 3] },
};

export const logDataOutputPayloads = {
	find: new LogDataValidator('log-data').find.parse(
		logDataInputPayloads.find,
	),
};
