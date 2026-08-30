import { z } from 'zod';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

const validatorMessages = [...sharedValidatorMessages] as const;

export class ApiDocsValidator extends BaseValidator<typeof validatorMessages> {
	/**
	 * `feature` is a route module name, so it is constrained to the kebab-case spelling those
	 * use. That is not cosmetic: the value reaches `getFeatureDocumentation` as a map key and
	 * anything outside this alphabet cannot match one — rejecting it here keeps a junk value
	 * from being answered with a bare 404 that looks like a real feature with no docs.
	 */
	read = z.object({
		feature: this.validateString(this.getMessage('invalid_string')).refine(
			(value) => /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value),
			{ message: this.getMessage('invalid_string') },
		),
	});
}
