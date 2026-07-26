import { lang } from '@/config/message.setup';
import { Configuration } from '@/config/settings.config';
import { formatDate, getErrorMessage } from '@/helpers';
import { getEmailService } from '@/providers/email/email-service.factory';
import {
	type LogDestination,
	LogDestinationEnum,
	type LogRecord,
} from '@/shared/types/log.type';
import type { LogDataLevel } from '@/shared/types/log-data.type';

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
}

/**
 * Emails high-severity logs to the address in `logging.logEmail`.
 *
 * Goes through `getEmailService()` so it honours `mail.provider` — the previous
 * implementation built its own nodemailer transport per log line, which meant SES
 * deployments still sent log mail over SMTP and every line paid for a new transport.
 *
 * Text-only on purpose: this is an operational alert, not templated user-facing mail, so
 * it deliberately bypasses the template/queue path in `email.provider.ts`.
 */
export class LogEmailDestination implements LogDestination {
	readonly name = LogDestinationEnum.EMAIL;

	constructor(readonly levels: ReadonlyArray<LogDataLevel>) {}

	async write(record: LogRecord): Promise<void> {
		const to = Configuration.get('logging.logEmail');

		if (!to) {
			return;
		}

		const from = Configuration.get('mail.from') as {
			name: string;
			address: string;
		};

		const body = JSON.stringify(
			{
				time: formatDate(record.time, undefined, {
					customFormat: 'HH:mm:ss Z',
				}),
				level: record.level,
				category: record.category,
				message: record.message,
				request_id: record.request_id,
				debugStack: record.debugStack,
				context: record.context,
			},
			null,
			2,
		);

		try {
			await getEmailService().sendEmail(
				{
					subject: lang('shared.debug.email_log_subject', {
						app: Configuration.get('app.name'),
						level: record.level,
					}),
					text: body,
					// Escaped, not sanitized: a log message can legitimately contain
					// markup, and the reader needs to see it verbatim rather than
					// have it stripped — or rendered.
					html: `<pre>${escapeHtml(body)}</pre>`,
				},
				from,
				{ name: '', address: to },
				from,
			);
		} catch (error) {
			// Reporting through the logger would recurse straight back into this
			// destination, so a failed alert goes to stderr and no further.
			console.error('Log email failed:', getErrorMessage(error));
		}
	}
}
