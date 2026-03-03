import TemplateEntity from '@/features/template/template.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class TemplatePolicy extends PolicyAbstract {
	constructor() {
		const entity = TemplateEntity.NAME;

		super(entity);
	}
}

export const templatePolicy = new TemplatePolicy();
