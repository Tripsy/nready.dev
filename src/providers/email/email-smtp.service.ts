import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { lang } from '@/config/message.setup';
import { Configuration } from '@/config/settings.config';
import { getErrorMessage } from '@/helpers/system.helper';
import type {
	EmailAddressType,
	EmailContent,
	EmailService,
} from '@/shared/types/email.type';

export class SmtpEmailService implements EmailService {
	private transporter: Transporter<SMTPTransport.SentMessageInfo> | null =
		null;

	private getTransporter() {
		if (!this.transporter) {
			const host = Configuration.get('mail.host');

			if (!host) {
				throw new Error('MAIL_HOST is not defined');
			}

			this.transporter = nodemailer.createTransport({
				host: Configuration.get('mail.host'),
				port: Configuration.get('mail.port'),
				secure: Configuration.get('mail.encryption'),
				auth: {
					user: Configuration.get('mail.username'),
					pass: Configuration.get('mail.password'),
				},
				connectionTimeout: 10000,
				logger: true,
				debug: true,
			});
		}

		return this.transporter;
	}

	async sendEmail(
		content: EmailContent,
		from: EmailAddressType,
		to: EmailAddressType,
		replyTo: EmailAddressType,
	): Promise<void> {
		try {
			await this.getTransporter().sendMail({
				to: to,
				replyTo: replyTo,
				from: from,
				subject: content.subject,
				text: content.text,
				html: content.html,
			});

			console.debug(
				lang('shared.debug.email_sent', {
					subject: content.subject,
					to: to.address,
				}),
			);
		} catch (error) {
			console.error(
				error,
				lang('shared.debug.email_error', {
					subject: content.subject,
					to: to.address,
					error: getErrorMessage(error),
				}),
			);

			// Re-throw the error so calling code can handle it too
			throw error;
		}
	}
}
