import { TemplateTypeEnum } from '@/features/template/template.entity';
import { getTemplateEntityMock } from '@/features/template/template.mock';
import type { templatePublicController } from '@/features/template/template-public.controller';
import {
	type ApiInputDocumentation,
	helperApiInputDocumentation,
} from '@/helpers/api-documentation.helper';

/**
 * The visitor-facing half of the template feature, mounted under `/public/pages` by
 * `template-public.routes.ts`. Documented separately from `template.docs.ts` because it is a
 * route module of its own — a different base path, a different controller, and no bearer
 * token — even though both describe the same entity.
 */
const entitySample = getTemplateEntityMock() as unknown as Record<
	string,
	unknown
>;

export const docs: Record<
	keyof typeof templatePublicController,
	ApiInputDocumentation
> = {
	read: helperApiInputDocumentation({
		description: 'Read one page by label',
		success: {
			status: 200,
			description: 'Page template in the language of the request',
			dataSample: {
				...entitySample,
				label: 'terms',
				type: TemplateTypeEnum.PAGE,
				content: {
					title: 'Terms and conditions',
					html: '<p>The terms you agree to.</p>',
					layout: 'default',
				},
			},
		},
		withErrors: [404, 422],
		request: {
			notes: `Only ${TemplateTypeEnum.PAGE} templates are addressable — the type is pinned by the controller, so an ${TemplateTypeEnum.EMAIL} template is absent whatever the label. The language is the request's own and there is no fallback, so a label with no row in that language answers 404. Content is returned exactly as stored: a page is not rendered through the template engine, so a \`{{ placeholder }}\` is served literally`,
			params: {
				label: {
					type: 'string',
					required: true,
					condition:
						'the URL segment the public site answers on, at /page/<label>',
				},
			},
		},
	}),
};
