import { lang } from '@/config/message.setup';
import { Configuration } from '@/config/settings.config';
import { CustomError } from '@/exceptions/custom.error';

export class NotAllowedError extends CustomError {
	constructor(message?: string) {
		super(403);

		if (Configuration.get('app.debug')) {
			this.message = message ?? lang('shared.error.not_allowed');
		} else {
			this.message = lang('shared.error.not_allowed');
		}
	}
}
