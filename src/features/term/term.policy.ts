import TermEntity from '@/features/term/term.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class TermPolicy extends PolicyAbstract {
	constructor() {
		const entity = TermEntity.NAME;

		super(entity);
	}
}

export const termPolicy = new TermPolicy();
