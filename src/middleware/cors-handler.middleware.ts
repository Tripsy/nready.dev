import cors from 'cors';
import { Configuration } from '@/config/settings.config';
import { NotAllowedError } from '@/exceptions';

const allowedOrigins = new Set(
	Configuration.get('security.allowedOrigins') || [],
);

export const corsHandler = cors({
	origin: (origin, callback) => {
		// Allow requests without an origin (server-to-server or same-origin)
		if (!origin) {
			return callback(null, true);
		}

		if (allowedOrigins.has(origin)) {
			return callback(null, true);
		}

		// Origin is present but not allowed
		return callback(new NotAllowedError());
	},
	credentials: true,
});
