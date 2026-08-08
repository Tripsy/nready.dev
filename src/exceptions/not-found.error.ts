import { lang } from '@/config/message.setup';
import { CustomError } from '@/exceptions/custom.error';

export class NotFoundError extends CustomError {
	constructor(message?: string) {
		super(404);

		this.message = message ?? lang('shared.error.not_found');
	}
}
