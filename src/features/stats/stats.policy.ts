import { NotAllowedError } from '@/exceptions';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';
import type { AuthContext } from '@/shared/types/express';

export class StatsPolicy extends PolicyAbstract {
	constructor() {
		const entity = 'stats';

		super(entity);
	}

	// Dashboard figures aggregate across every feature, so there is no per-entity permission
	// that could scope them — they are admin-only.
	public seeStats(auth: AuthContext): void {
		this.requiredAuth(auth);

		if (this.isAdmin(auth)) {
			return;
		}

		throw new NotAllowedError();
	}
}

export const statsPolicy = new StatsPolicy();
