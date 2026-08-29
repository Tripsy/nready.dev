import { Configuration } from '@/config/settings.config';
import { CronHistoryStatusEnum } from '@/features/cron-history/cron-history.entity';
import { getCronHistoryRepository } from '@/features/cron-history/cron-history.repository';
import { createPastDate } from '@/helpers/date.helper';
import { loadEmailTemplate, queueEmail } from '@/providers/email.provider';

export const SCHEDULE_EXPRESSION = '01 02 * * *';
export const EXPECTED_RUN_TIME = 3; // seconds

// Report cron errors in the last 24 hours
const cronErrorCount = async () => {
	const query = getCronHistoryRepository()
		.createQuery()
		.select(['id'])
		.filterByRange('start_at', createPastDate(86400)) // Last 24 hours
		.filterBy('status', CronHistoryStatusEnum.ERROR);

	const errorCount = await query.count();

	if (errorCount > 0) {
		const emailTemplate = await loadEmailTemplate(
			'cron-error-count',
			Configuration.language(),
		);

		emailTemplate.content.vars = {
			errorCount: errorCount,
			querySql: query.debugSql(),
			queryParameters: JSON.stringify(query.debugParameters()),
		};

		await queueEmail(emailTemplate, {
			name: Configuration.get('app.name'),
			address: Configuration.get('app.email'),
		});
	}

	return {
		errorCount: errorCount,
	};
};

export default cronErrorCount;
