import type CronHistoryEntity from '@/features/cron-history/cron-history.entity';
import { CronHistoryStatusEnum } from '@/features/cron-history/cron-history.entity';
import {
	CronHistoryValidator,
	OrderByEnum,
} from '@/features/cron-history/cron-history.validator';
import { createPastDate, formatDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getCronHistoryEntityMock(): CronHistoryEntity {
	return {
		id: 1,
		label: 'cronErrorCount',
		start_at: createPastDate(28800),
		end_at: createPastDate(28900),
		status: CronHistoryStatusEnum.ERROR,
		run_time: 1,
		content: { warnings: [{ label: 'cronTimeCheck' }] },
	};
}

export const cronHistoryInputPayloads = {
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			id: 1,
			term: 'test',
			status: CronHistoryStatusEnum.ERROR,
			start_date_start: formatDate(createPastDate(14400)),
			start_date_end: formatDate(createPastDate(7200)),
		},
	},
	delete: { ids: [1, 2, 3] },
};

export const cronHistoryOutputPayloads = {
	find: new CronHistoryValidator('cron-history').find.parse(
		cronHistoryInputPayloads.find,
	),
};
