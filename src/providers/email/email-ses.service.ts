import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { lang } from '@/config/message.setup';
import { Configuration } from '@/config/settings.config';
import { getErrorMessage } from '@/helpers/system.helper';
import type {
	EmailAddressType,
	EmailContent,
	EmailService,
} from '@/shared/types/email.type';

export class SesEmailService implements EmailService {
	private ses: SESClient;

	constructor() {
		this.ses = new SESClient({
			// Not `aws.region`: the verified sending identity may live in a different
			// region than the one this instance runs in. Defaults to aws.region when
			// AWS_SES_REGION is unset.
			region: Configuration.get('aws.ses.region'),
			credentials: defaultProvider(),
			// logger: console,
		});
	}

	async sendEmail(
		content: EmailContent,
		from: EmailAddressType,
		to: EmailAddressType,
		replyTo: EmailAddressType,
	): Promise<void> {
		try {
			await this.ses.send(
				new SendEmailCommand({
					Source: `"${from.name}" <${from.address}>`,
					Destination: {
						ToAddresses: [to.address],
					},
					ReplyToAddresses: [replyTo.address],
					Message: {
						Subject: {
							Data: content.subject,
							Charset: 'UTF-8',
						},
						Body: {
							Html: {
								Data: content.html,
								Charset: 'UTF-8',
							},
							Text: {
								Data:
									content.text ??
									'You have a new contact message.',
								Charset: 'UTF-8',
							},
						},
					},
				}),
			);

			console.debug(
				lang('shared.debug.email_sent', {
					subject: content.subject,
					to: to.address,
				}),
			);
		} catch (error: unknown) {
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
