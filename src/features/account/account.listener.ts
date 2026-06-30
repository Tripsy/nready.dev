import {
	eventEmitter,
	type UserRegisteredEventPayload,
} from '@/config/event.config';
import { accountService } from '@/features/account/account.service';

export default function registerAccountListener() {
	eventEmitter.on(
		'userRegistered',
		async (payload: UserRegisteredEventPayload) => {
			void accountService.processRegistration(payload);
		},
	);
}
