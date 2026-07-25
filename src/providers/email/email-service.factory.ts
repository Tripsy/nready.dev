import { Configuration } from '@/config/settings.config';
import { SesEmailService } from '@/providers/email/email-ses.service';
import { SmtpEmailService } from '@/providers/email/email-smtp.service';
import {
	type EmailProvider,
	EmailProviderEnum,
	type EmailService,
} from '@/shared/types/email.type';

/**
 * Lives here rather than in `email.provider.ts` so the log-email destination can resolve
 * a transport without importing that module — `email.provider.ts` imports the logger, so
 * going through it would close a cycle (logger -> destination -> email.provider -> logger).
 * This file deliberately imports nothing that reaches the logger.
 */
let currentServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
	if (currentServiceInstance) {
		return currentServiceInstance;
	}

	const provider =
		(Configuration.get('mail.provider') as EmailProvider) ||
		EmailProviderEnum.SES;

	switch (provider) {
		case EmailProviderEnum.SMTP:
			currentServiceInstance = new SmtpEmailService();
			break;
		default:
			currentServiceInstance = new SesEmailService();
			break;
	}

	return currentServiceInstance;
}
