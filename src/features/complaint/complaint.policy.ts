import ComplaintEntity from '@/features/complaint/complaint.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

/**
 * Dashboard authorization only. The public endpoints carry no permission — anyone with an account
 * may report what they are reading — but they are not open either: `user_id` is `NOT NULL` on this
 * table, so the public controller requires an authenticated caller and scopes every write to the
 * rows that caller owns (`ComplaintQuery.filterByOwner`).
 */
export class ComplaintPolicy extends PolicyAbstract {
	constructor() {
		const entity = ComplaintEntity.NAME;

		super(entity);
	}
}

export const complaintPolicy = new ComplaintPolicy();
