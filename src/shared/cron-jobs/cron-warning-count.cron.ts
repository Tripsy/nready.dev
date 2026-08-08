import { Configuration } from '@/config/settings.config';
import { getCronHistoryRepository } from '@/features/cron-history/cron-history.repository';
import { createPastDate } from '@/helpers/date.helper';
import { loadEmailTemplate, queueEmail } from '@/providers/email.provider';

export const SCHEDULE_EXPRESSION = '02 02 * * *';
export const EXPECTED_RUN_TIME = 3; // seconds

// Report cron warnings in the last 7 days
const cronWarningCount = async () => {
	const q = getCronHistoryRepository()
		.createQuery()
		.select(
			[
				'cron_history.label AS label',
				'COUNT(cron_history.id) AS countOccurrences',
				'AVG(cron_history.run_time) AS avgRunTime',
			],
			false,
		)
		.filterByRange('start_at', createPastDate(86400 * 7)) // last 7 days
		.filterBy('status', 'error')
		.groupBy('label')
		.getQuery();

	const warnings = await q.getRawMany();

	if (warnings) {
		const warningCount: number = warnings.reduce(
			(sum: number, warning) => sum + Number(warning.countOccurrences),
			0,
		);

		if (warningCount > 0) {
			const emailTemplate = await loadEmailTemplate(
				'cron-warning-count',
				Configuration.language(),
			);

			emailTemplate.content.vars = {
				warningCount: warningCount,
				warnings: warnings,
				querySql: q.getSql(),
				queryParameters: JSON.stringify(q.getParameters()),
			};

			await queueEmail(emailTemplate, {
				name: Configuration.get('app.name'),
				address: Configuration.get('app.email'),
			});
		}
	}

	return {
		warnings: warnings,
	};
};

export default cronWarningCount;
