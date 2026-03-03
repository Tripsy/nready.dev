import { lang } from '@/config/i18n.setup';
import { BadRequestError, CustomError } from '@/exceptions';
import type { StatusTransitions } from '@/shared/types/common.type';

export function assertValidStatusTransition<S extends string>(
	statusTransitions: StatusTransitions<S>,
	currentStatus: S,
	newStatus: S,
) {
	if (currentStatus === newStatus) {
		throw new BadRequestError(
			lang('shared.error.status_unchanged', { status: newStatus }),
		);
	}

	const allowed = statusTransitions[currentStatus] || [];

	if (!allowed.includes(newStatus)) {
		throw new CustomError(
			409,
			lang('shared.error.status_update_not_allowed', {
				currentStatus: currentStatus,
				newStatus: newStatus,
			}),
		);
	}
}
