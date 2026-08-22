import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import type { ComplaintEntityType } from '@/features/complaint/complaint.entity';
import ComplaintEntity from '@/features/complaint/complaint.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ComplaintQuery extends RepositoryAbstract<ComplaintEntity> {
	constructor(repository: Repository<ComplaintEntity>) {
		super(repository, ComplaintEntity.NAME);
	}

	/**
	 * The two columns that name what was reported, in the order `UQ_complaint_user` holds them —
	 * the unique doubles as the target lookup, so a dashboard listing filtered by target is served
	 * by it without an index of its own.
	 */
	filterByTarget(
		entityType?: ComplaintEntityType | null,
		entityId?: number | null,
	): this {
		this.filterBy('entity_type', entityType);
		this.filterBy('entity_id', entityId);

		return this;
	}

	/**
	 * Narrows to the rows the caller may speak for, which is what makes a public amendment or
	 * withdrawal safe without an ownership check downstream.
	 *
	 * There is no guest branch here, unlike `comment` and `rating`: `user_id` is `NOT NULL` on this
	 * table, so a complaint is always attached to an account and an address hash would identify
	 * nobody the row is keyed by.
	 */
	filterByOwner(userId: number): this {
		this.filterBy('user_id', userId);

		return this;
	}

	/**
	 * How many separate people stand behind the live complaints this query addresses.
	 *
	 * Counted by address rather than by row or by account: two accounts sharing a mailbox are one
	 * person, and one person is one complaint however many ways they file it. `LOWER` because an
	 * address is case-insensitive in its domain part and, in practice, in its local part too.
	 *
	 * An `INNER` join, so a complaint whose reporter cannot be identified does not count — one
	 * whose account has since been soft-deleted among them. Withdrawn complaints are already out:
	 * the builder excludes soft-deleted rows unless `withDeleted` asks for them.
	 */
	async countDistinctReporters(): Promise<number> {
		const row = await this.query
			.innerJoin(
				`${this.entity}.user`,
				'reporter',
				'reporter.deleted_at IS NULL',
			)
			.andWhere("COALESCE(reporter.email, '') <> ''")
			.select('COUNT(DISTINCT LOWER(reporter.email))', 'total')
			.getRawOne<{ total: string }>();

		return Number(row?.total ?? 0);
	}

	/**
	 * The moderation search box, over the only free text a complaint carries. `ILIKE` rather than
	 * a full-text index: a moderator searches for a fragment — a URL, half a word, a name — which
	 * `to_tsquery` cannot express and stemming would defeat.
	 */
	filterByTerm(term?: string | null): this {
		if (!term) {
			return this;
		}

		this.filterBy('description', term, 'ILIKE');

		return this;
	}
}

export const getComplaintRepository = () =>
	dataSource.getRepository(ComplaintEntity).extend({
		createQuery() {
			return new ComplaintQuery(this);
		},
	});
