import type { EntityManager } from 'typeorm';
import dataSource from '@/config/data-source.config';
import { eventEmitter } from '@/config/event.config';
import { lang } from '@/config/message.setup';
import { BadRequestError } from '@/exceptions';
import type {
	CommentEntityType,
	CommentStatus,
} from '@/features/comment/comment.entity';
import CommentEntity, {
	CommentStatusEnum,
	CommentTypeEnum,
	STATUS_TRANSITIONS,
} from '@/features/comment/comment.entity';
import { getCommentRepository } from '@/features/comment/comment.repository';
import type { CommentValidator } from '@/features/comment/comment.validator';
import { createCurrentDate } from '@/helpers/date.helper';
import { assertValidStatusTransition } from '@/shared/abstracts/service.abstract';
import type { ValidatorOutput } from '@/shared/types/mock.type';

/**
 * Who the request counts as. `user_id` is null for a guest; `user_ip_hash` is always present, which
 * is what lets a guest be addressed at all — it is the only handle their later edit or withdrawal
 * can be matched by.
 *
 * `is_staff` is resolved from the caller's role, never from the body: it is a badge the comment is
 * rendered with, so a visitor claiming it would be claiming to speak for the site.
 */
export type CommentAuthor = {
	user_id: number | null;
	user_ip_hash: string;
	is_staff: boolean;
};

/** The columns a public read returns. The author's address hash is never among them. */
const PUBLIC_COLUMNS: string[] = [
	'comment.id',
	'comment.entity_type',
	'comment.entity_id',
	'comment.type',
	'comment.content',
	'comment.parent_id',
	'comment.user_id',
	'comment.guest_name',
	'comment.guest_website',
	'comment.reply_count',
	'comment.is_pinned',
	'comment.is_staff',
	'comment.created_at',
	'comment.updated_at',
];

export class CommentService {
	constructor(private repository: ReturnType<typeof getCommentRepository>) {}

	/**
	 * @description Used in `create` method from the public controller
	 *
	 * Lands as `pending` whoever writes it — the column default — so nothing reaches a reader
	 * before a moderator has seen it.
	 *
	 * The parent's `reply_count` does **not** move here, and that is the whole reason moderation
	 * exists: the counter is read publicly, next to a list that shows approved replies only, so
	 * counting a pending one would advertise a reply nobody can open. It moves in `updateStatus`
	 * instead, when the reply actually becomes visible.
	 *
	 * Nothing is cached away either, for the same reason: a pending comment changes no public read.
	 */
	public async create(
		data: ValidatorOutput<CommentValidator, 'create'>,
		author: CommentAuthor,
	): Promise<CommentEntity> {
		const isGuest = author.user_id === null;

		/*
		 * `CHK_comment_author` holds the same rule in the database. Checking it here is what turns
		 * a missing name into a 400 the caller can act on — the constraint violation it would
		 * otherwise raise reaches them as a masked 500.
		 */
		if (isGuest && (!data.guest_name || !data.guest_email)) {
			throw new BadRequestError(lang('comment.error.guest_required'));
		}

		const parent = await this.resolveParent(data);

		return this.repository.save(
			this.repository.create({
				entity_type: data.entity_type,
				entity_id: data.entity_id,
				type: data.type ?? CommentTypeEnum.COMMENT,
				content: data.content,
				parent_id: parent?.id ?? null,
				user_id: author.user_id,
				user_ip_hash: author.user_ip_hash,
				// A member is identified by their account; the guest fields describe somebody
				// who has none, so carrying both would leave two names on one comment.
				guest_name: isGuest ? data.guest_name : null,
				guest_email: isGuest ? data.guest_email : null,
				guest_website: isGuest ? data.guest_website : null,
				is_staff: author.is_staff,
			}),
		);
	}

	/**
	 * A reply may only hang from a comment that is already public and sits on the same target.
	 *
	 * Both halves matter. Without the status check a visitor who guessed an id could hang a reply
	 * off a rejected comment and pull it back into view; without the target check they could move a
	 * thread from one article onto another, since `parent_id` carries no target of its own.
	 *
	 * Depth is not capped: `parent_id` cascades, and `resolveSubtree` walks however deep the tree
	 * actually goes.
	 */
	private async resolveParent(
		data: ValidatorOutput<CommentValidator, 'create'>,
	): Promise<CommentEntity | null> {
		if (!data.parent_id) {
			return null;
		}

		const parent = await this.repository
			.createQuery()
			.select(['comment.id'])
			.filterById(data.parent_id)
			.filterByTarget(data.entity_type, data.entity_id)
			.filterByStatus(CommentStatusEnum.APPROVED)
			.first();

		if (!parent) {
			throw new BadRequestError(lang('comment.error.invalid_parent'));
		}

		return parent;
	}

	/**
	 * @description Used in `update` method from the public controller
	 *
	 * Editable only while the comment is still `pending`. Once approved the text is what a
	 * moderator passed and what readers have seen, and an unrestricted edit is the standard way
	 * around moderation: post something innocuous, wait for approval, rewrite it.
	 *
	 * Re-queueing an approved comment instead is not open either — `STATUS_TRANSITIONS` has no
	 * path back from `approved` to `pending`, by design.
	 */
	public async updateOwn(
		data: ValidatorOutput<CommentValidator, 'publicUpdate'>,
		author: CommentAuthor,
	): Promise<CommentEntity> {
		const entry = await this.repository
			.createQuery()
			.filterById(data.id)
			.filterByOwner(author.user_id, author.user_ip_hash)
			.firstOrFail();

		if (entry.status !== CommentStatusEnum.PENDING) {
			throw new BadRequestError(lang('comment.error.not_editable'));
		}

		entry.content = data.content;

		return this.repository.save(entry);
	}

	/**
	 * @description Used in `delete` method from the public controller
	 *
	 * Scoped to the caller's own row, so a visitor can only ever withdraw what they wrote. A
	 * comment somebody else owns raises the repository's 404 — the same answer an id that never
	 * existed gives, which is what keeps this from reporting on rows the caller cannot see.
	 */
	public async deleteOwn(
		data: ValidatorOutput<CommentValidator, 'publicDelete'>,
		author: CommentAuthor,
	): Promise<void> {
		const entry = await this.repository
			.createQuery()
			.filterById(data.id)
			.filterByOwner(author.user_id, author.user_ip_hash)
			.firstOrFail();

		await this.removeSubtree(entry);
	}

	/**
	 * @description Used in `delete` method from the dashboard controller
	 */
	public async delete(id: number): Promise<void> {
		await this.removeSubtree(await this.findById(id));
	}

	/**
	 * Removes a comment and everything hanging beneath it.
	 *
	 * `parent_id` is `ON DELETE CASCADE`, so the descendants go with the root on their own. What
	 * cascade cannot reach is everything pointing at those rows *polymorphically* — `rating` names
	 * a comment through `(entity_type, entity_id)` with no foreign key to travel. The subtree is
	 * therefore resolved before the delete and announced afterwards on `entityRemoved`, which the
	 * feature owning those rows listens for and clears on its own; this service holds no reference
	 * to any of them, and names nothing beyond its own table.
	 *
	 * The announcement sits outside the transaction, and after it commits: a listener running
	 * inside would be clearing rows for a delete that could still roll back. The cleanup is
	 * therefore eventually consistent rather than atomic, which is safe because Postgres does not
	 * reuse a serial id — nothing can claim the ids those rows still point at in the meantime.
	 *
	 * The parent's `reply_count` drops by exactly one, and only when the row being removed was
	 * approved: the counter follows visibility (see `updateStatus`), so a pending reply was never
	 * in it to subtract. It counts direct replies, so removing a whole subtree still costs its
	 * parent a single reply.
	 */
	private async removeSubtree(entry: CommentEntity): Promise<void> {
		const removedIds = await dataSource.transaction(async (manager) => {
			const ids = await this.resolveSubtree(manager, entry.id);

			if (
				entry.parent_id &&
				entry.status === CommentStatusEnum.APPROVED
			) {
				await manager
					.getRepository(CommentEntity)
					.decrement({ id: entry.parent_id }, 'reply_count', 1);
			}

			await manager.getRepository(CommentEntity).delete({ id: entry.id });

			return ids;
		});

		eventEmitter.emit('entityRemoved', {
			entity_type: CommentEntity.NAME,
			entity_ids: removedIds,
		});

		this.cleanThreadCache(entry.entity_type, entry.entity_id);
	}

	/**
	 * Every id in the subtree rooted at `rootId`, the root included.
	 *
	 * A recursive CTE rather than a walk in application code: the depth is unbounded, and one query
	 * per level would issue as many round trips as the deepest thread is long.
	 */
	private async resolveSubtree(
		manager: EntityManager,
		rootId: number,
	): Promise<number[]> {
		const rows = await manager.query<{ id: number }[]>(
			`WITH RECURSIVE subtree AS (
				SELECT id FROM "${CommentEntity.NAME}" WHERE id = $1
				UNION ALL
				SELECT child.id
				FROM "${CommentEntity.NAME}" child
				JOIN subtree ON child.parent_id = subtree.id
			)
			SELECT id FROM subtree`,
			[rootId],
		);

		return rows.map((row) => Number(row.id));
	}

	/**
	 * Comments left behind by a target that no longer exists. `(entity_type, entity_id)` carries no
	 * foreign key, so nothing removes them when an article or a review goes away — whoever deletes
	 * the target calls this.
	 *
	 * Roots only: their descendants follow through the cascade, and deleting a reply whose parent is
	 * in the same sweep would only move a counter that is about to be removed.
	 */
	public async deleteByTarget(
		entityType: CommentEntityType,
		entityId: number,
	): Promise<void> {
		const roots = await this.repository
			.createQuery()
			.select(['comment.id'])
			.filterByTarget(entityType, entityId)
			.filterByParent(null)
			.all();

		for (const root of roots) {
			await this.removeSubtree(root);
		}
	}

	/**
	 * @description Used in `update` method from the dashboard controller
	 *
	 * Only the presentation of a comment is editable here — its text, what kind of contribution it
	 * is, whether it sits at the top of the thread. The moderation decision itself moves through
	 * `updateStatus`, which is the only place `STATUS_TRANSITIONS` is honoured.
	 */
	public async updateData(
		entry: CommentEntity,
		data: ValidatorOutput<CommentValidator, 'update'>,
	): Promise<CommentEntity> {
		if (data.content !== undefined) {
			entry.content = data.content;
		}

		if (data.type !== undefined) {
			entry.type = data.type;
		}

		if (data.is_pinned !== undefined) {
			entry.is_pinned = data.is_pinned;
		}

		const saved = await this.repository.save(entry);

		this.cleanThreadCache(saved.entity_type, saved.entity_id);

		return saved;
	}

	/**
	 * @description Used in `statusUpdate` method from the dashboard controller
	 *
	 * The moderation trail is written with the decision, in the same save: who decided, when, and
	 * why. `moderation_reason` is overwritten on every decision rather than appended to — it
	 * describes the state the comment is in now, and the history of how it got there is what
	 * `log_history` keeps.
	 *
	 * `moderatedBy` is nullable because the column is: the caller is always authenticated here, but
	 * a decision taken by a background sweep — a spam classifier, an orphan cleanup — has no user
	 * to name, and forcing one would mean inventing it.
	 *
	 * This is also where a reply enters or leaves its parent's `reply_count`, in the same
	 * transaction as the decision that moved it: the counter tracks what a reader can actually
	 * open, so it follows visibility rather than existence. Only a crossing of the `approved`
	 * boundary counts — `rejected → spam` changes nothing that was ever on show.
	 */
	public async updateStatus(
		entry: CommentEntity,
		newStatus: CommentStatus,
		moderatedBy: number | null,
		moderationReason?: string,
	): Promise<CommentEntity> {
		assertValidStatusTransition(
			STATUS_TRANSITIONS,
			entry.status,
			newStatus,
		);

		const wasVisible = entry.status === CommentStatusEnum.APPROVED;
		const isVisible = newStatus === CommentStatusEnum.APPROVED;

		entry.status = newStatus;
		entry.moderated_at = createCurrentDate();
		entry.moderated_by = moderatedBy;
		entry.moderation_reason = moderationReason ?? null;

		const saved = await dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(CommentEntity);

			const stored = await repository.save(entry);

			if (entry.parent_id && wasVisible !== isVisible) {
				const move = isVisible
					? repository.increment.bind(repository)
					: repository.decrement.bind(repository);

				await move({ id: entry.parent_id }, 'reply_count', 1);
			}

			return stored;
		});

		this.cleanThreadCache(saved.entity_type, saved.entity_id);

		return saved;
	}

	public findById(id: number): Promise<CommentEntity> {
		return this.repository.createQuery().filterById(id).firstOrFail();
	}

	/**
	 * @description Used in `read` method from the dashboard controller
	 *
	 * The moderation view, so it carries what the public one hides: the guest's email and the
	 * moderation trail. `user_ip_hash` stays out even here — it identifies a visitor across every
	 * comment they ever left, and no moderation decision is made from it.
	 */
	public getEntryData(id: number): Promise<CommentEntity> {
		return this.repository
			.createQuery()
			.join('comment.user', 'user', 'LEFT')
			.select([
				...PUBLIC_COLUMNS,
				'comment.status',
				'comment.guest_email',
				'comment.moderated_at',
				'comment.moderated_by',
				'comment.moderation_reason',

				'user.id',
				'user.name',
				'user.email',
			])
			.filterById(id)
			.firstOrFail();
	}

	/**
	 * @description Used in `find` method from the dashboard controller
	 *
	 * Carries the whole moderation trail, not just its timestamp: the dashboard's detail window
	 * renders the row it already holds from this list rather than re-reading it, so a column left
	 * out here shows up there as an empty field.
	 */
	public findByFilter(data: ValidatorOutput<CommentValidator, 'find'>) {
		return this.repository
			.createQuery()
			.join('comment.user', 'user', 'LEFT')
			.select([
				...PUBLIC_COLUMNS,
				'comment.status',
				'comment.moderated_at',
				'comment.moderated_by',
				'comment.moderation_reason',

				'user.id',
				'user.name',
			])
			.filterByTarget(data.filter.entity_type, data.filter.entity_id)
			.filterBy('type', data.filter.type)
			.filterByStatus(data.filter.status)
			.filterByParent(data.filter.parent_id)
			.filterBy('user_id', data.filter.user_id)
			.filterByBoolean('is_pinned', data.filter.is_pinned)
			.filterByTerm(data.filter.term)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}

	/**
	 * @description Used in `find` method from the public controller
	 *
	 * One level of one thread, approved rows only. Pinned first, then by the requested ordering —
	 * a pinned comment is pinned to the top of the page it is on, which is why the flag leads the
	 * sort rather than filtering into a list of its own.
	 */
	public findPublic(data: ValidatorOutput<CommentValidator, 'publicFind'>) {
		return (
			this.repository
				.createQuery()
				.join('comment.user', 'user', 'LEFT')
				.select([...PUBLIC_COLUMNS, 'user.id', 'user.name'])
				.filterByTarget(data.entity_type, data.entity_id)
				.filterByStatus(CommentStatusEnum.APPROVED)
				// An absent `parent_id` reads the roots, not the whole flat thread: replies are fetched
				// per parent, so a long discussion does not have to arrive in one page.
				.filterByParent(data.filter.parent_id ?? null)
				.filterBy('type', data.filter.type)
				.orderBy('is_pinned', 'DESC')
				.orderBy(data.order_by, data.direction)
				.pagination(data.page, data.limit)
				.all(true)
		);
	}

	/**
	 * @description Used in `find` method from the public controller
	 *
	 * The earliest approved reply under each of the given comments, keyed by the comment it
	 * answers.
	 *
	 * A thread shows its first reply without being unrolled, and resolving that per root would
	 * cost one request per root on every page — the same shape the bulk rating read exists to
	 * avoid. One query answers for the whole page instead.
	 *
	 * `MIN(id)` rather than the earliest `created_at`: ids are sequential here, so the two agree,
	 * and a grouped subquery on the primary key is portable in a way `DISTINCT ON` is not.
	 */
	public async findFirstReplies(
		parentIds: number[],
	): Promise<Record<number, CommentEntity>> {
		if (parentIds.length === 0) {
			return {};
		}

		const entries = await this.repository
			.createQuery()
			.join('comment.user', 'user', 'LEFT')
			.select([...PUBLIC_COLUMNS, 'user.id', 'user.name'])
			.filterRaw(
				`${CommentEntity.NAME}.id IN (
					SELECT MIN(reply.id)
					FROM "${CommentEntity.NAME}" reply
					WHERE reply.parent_id IN (:...parentIds)
					  AND reply.status = :status
					GROUP BY reply.parent_id
				)`,
				{ parentIds, status: CommentStatusEnum.APPROVED },
			)
			.all();

		const firstReplies: Record<number, CommentEntity> = {};

		for (const entry of entries) {
			if (entry.parent_id) {
				firstReplies[entry.parent_id] = entry;
			}
		}

		return firstReplies;
	}

	/**
	 * What a public write may hand back: the comment, minus everything about its author that the
	 * author did not send. `user_ip_hash` above all — it is the handle a guest's later edit is
	 * matched by, so echoing it publishes the one credential an anonymous comment has — but the
	 * moderation trail has no business leaving the dashboard either.
	 *
	 * `status` stays, and has to: the response is what tells the visitor their comment is waiting
	 * on a moderator rather than already live.
	 */
	public toPublicView(entry: CommentEntity): Record<string, unknown> {
		return {
			id: entry.id,
			entity_type: entry.entity_type,
			entity_id: entry.entity_id,
			type: entry.type,
			content: entry.content,
			status: entry.status,
			parent_id: entry.parent_id ?? null,
			user_id: entry.user_id ?? null,
			guest_name: entry.guest_name ?? null,
			guest_website: entry.guest_website ?? null,
			reply_count: entry.reply_count,
			is_pinned: entry.is_pinned,
			is_staff: entry.is_staff,
			created_at: entry.created_at,
			updated_at: entry.updated_at,
		};
	}

	/**
	 * Drops every cached page of a thread.
	 *
	 * Keyed by target rather than by row, which is what a public read is addressed by: one new
	 * approval changes an unknown number of pages, and there is no id shared between them to clean
	 * by. `cleanEntityCache` cannot express that shape — it builds `<entity>:<id>*`.
	 *
	 * The pattern is a prefix, so target 1 also drops targets 10 and 100. Over-invalidating costs a
	 * refill and nothing else; the alternative is a delimiter in the key that every reader would
	 * have to agree on.
	 */
	private cleanThreadCache(
		entityType: CommentEntityType,
		entityId: number,
	): void {
		if (!CommentEntity.HAS_CACHE) {
			return;
		}

		eventEmitter.emit('cacheClean', {
			cacheKeyArgs: [CommentEntity.NAME, entityType, String(entityId)],
		});
	}
}

export const commentService = new CommentService(getCommentRepository());
