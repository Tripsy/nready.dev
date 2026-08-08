import { lang } from '@/config/message.setup';
import { CustomError } from '@/exceptions/custom.error';

export class UnprocessableContentError extends CustomError {
	constructor(message?: string) {
		super(422);

		this.message = message ?? lang('shared.error.check_errors');
	}
}
