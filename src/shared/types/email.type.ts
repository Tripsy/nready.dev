export type EmailContent = {
	subject: string;
	text?: string;
	html: string;
	layout?: string;
};

export type TemplateVars = Record<
	string,
	string | number | boolean | string[] | Record<string, string>
>;

export type EmailTemplate = {
	language: string;
	content: EmailContent;
	vars?: TemplateVars;
};

export type EmailAddressType = {
	name: string;
	address: string;
};

export const EmailProviderEnum = {
	SMTP: 'smtp',
	SES: 'ses',
} as const;

export type EmailProvider =
	(typeof EmailProviderEnum)[keyof typeof EmailProviderEnum];

export type SendEmailArgs = {
	content: EmailContent;
	from?: EmailAddressType;
	to: EmailAddressType;
	replyTo?: EmailAddressType;
};

export interface EmailService {
	sendEmail(
		content: EmailContent,
		from: EmailAddressType,
		to: EmailAddressType,
		replyTo: EmailAddressType,
	): Promise<void>;
}
