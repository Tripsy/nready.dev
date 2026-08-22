import {
	type TemplateSeedEntry,
	TemplateTypeEnum,
} from '@/features/template/template.entity';

/**
 * The email templates the comment feature sends, kept with the feature rather than in
 * `template.seed.ts`: `comment` is an additional feature and can be removed by `cli/feature.ts`,
 * which would leave the core seed inserting rows nothing renders. The template seed discovers
 * every `<feature>/database/*.templates.ts` and inserts them alongside its own.
 *
 * Rendered by `comment-email.service.ts` for the digest the subscriber cron sends.
 */
const commentTemplates: TemplateSeedEntry[] = [
	{
		label: 'comment-notification',
		language: 'en',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'New comments on a discussion you follow',
			html: `
                <p>Hello {{ name }}, there {% if count == 1 %}is 1 new comment{% else %}are {{ count }} new comments{% endif %} on a discussion you are following.</p>
                {% for comment in comments %}
                    <p>
                        <strong>{{ comment.author }}</strong> <em>({{ comment.created_at }})</em><br>
                        {{ comment.content }}<br>
                        <a href="{{ siteUrl }}/comments/{{ comment.id }}">Read the comment</a>
                    </p>
                {% endfor %}
                <p>
                    You are receiving this because you commented on the same discussion.
                    <a href="{{ siteUrl }}/comments/unsubscribe/{{ unsubscribe_token }}">Manage or stop these notifications</a>.
                </p>
            `,
			layout: 'layout-default',
		},
	},
	/*
	 * The one template that ships in a second language, because it is the only one addressed to a
	 * reader whose language the system actually knows: a subscription stores it, and the digest
	 * asks for it. Everything else here is either staff-facing or sent inside a flow the user is
	 * already reading in their own language. A language with no template still delivers — see the
	 * fallback in `loadEmailTemplate`.
	 */
	{
		label: 'comment-notification',
		language: 'ro',
		type: TemplateTypeEnum.EMAIL,
		content: {
			subject: 'Comentarii noi într-o discuție pe care o urmărești',
			html: `
                <p>Salut {{ name }}, {% if count == 1 %}există 1 comentariu nou{% else %}există {{ count }} comentarii noi{% endif %} într-o discuție pe care o urmărești.</p>
                {% for comment in comments %}
                    <p>
                        <strong>{{ comment.author }}</strong> <em>({{ comment.created_at }})</em><br>
                        {{ comment.content }}<br>
                        <a href="{{ siteUrl }}/comments/{{ comment.id }}">Vezi comentariul</a>
                    </p>
                {% endfor %}
                <p>
                    Primești acest email pentru că ai comentat în aceeași discuție.
                    <a href="{{ siteUrl }}/comments/unsubscribe/{{ unsubscribe_token }}">Gestionează sau oprește aceste notificări</a>.
                </p>
            `,
			layout: 'layout-default',
		},
	},
];

export default commentTemplates;
