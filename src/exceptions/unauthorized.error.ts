import { lang } from '@/config/message.setup';
import { Configuration } from '@/config/settings.config';
import { CustomError } from '@/exceptions/custom.error';

export class UnauthorizedError extends CustomError {
	constructor(message?: string) {
		super(401);

		if (Configuration.get('app.debug')) {
			this.message = message ?? lang('shared.error.unauthorized');
		} else {
			this.message = lang('shared.error.unauthorized');
		}
	}
}
