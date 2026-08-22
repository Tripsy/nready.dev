import { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import {
	CommentEntityTypeEnum,
	CommentStatusEnum,
	CommentTypeEnum,
} from '@/features/comment/comment.entity';
import { hasAtLeastOneValue } from '@/helpers/objects.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

export const OrderByEnum = {
	ID: 'id',
	CREATED_AT: 'created_at',
	STATUS: 'status',
} as const;

export const COMMENT_CONTENT_MIN = 2;
export const COMMENT_CONTENT_MAX = 5000;
export const GUEST_NAME_MIN = 2;
export const GUEST_NAME_MAX = 100;
export const GUEST_WEBSITE_MAX = 255;
export const MODERATION_REASON_MAX = 255;

/** What a moderator may change on the row itself; status moves through `statusUpdate` instead. */
export const paramsUpdateList: string[] = ['content', 'type', 'is_pinned'];

const validatorMessages = [
	...sharedValidatorMessages,
	'invalid_entity_type',
	'invalid_entity_id',
	'invalid_type',
	'invalid_content',
	'invalid_parent_id',
	'invalid_guest_name',
	'invalid_guest_email',
	'invalid_guest_website',
	'invalid_moderation_reason',
	'invalid_is_pinned',
	'invalid_term',
] as const;

export class CommentValidator extends BaseValidator<typeof validatorMessages> {
	/** The polymorphic target, shared by every schema that addresses one. */
	private targetSchema() {
		return {
			entity_type: this.validateEnum(
				CommentEntityTypeEnum,
				this.getMessage('invalid_entity_type'),
			),
			entity_id: this.validateId(this.getMessage('invalid_entity_id')),
		};
	}

	private contentSchema(required: boolean) {
		const message = {
			invalid: this.getMessage('invalid_content'),
			min_chars: this.getMessage('invalid_content'),
			max_chars: this.getMessage('invalid_content'),
		};

		const options = {
			minChars: COMMENT_CONTENT_MIN,
			maxChars: COMMENT_CONTENT_MAX,
		};

		return required
			? this.validateString(message, { ...options, required: true })
			: this.validateString(message, { ...options, required: false });
	}

	/**
	 * What a visitor posts. The author is never in the body — it is resolved from the request — so
	 * the only identity fields here are the ones a guest supplies about themselves, and they stay
	 * optional at this level: whether they are required depends on whether the caller is signed in,
	 * which is a fact about the request rather than about its shape. `CommentService` holds that
	 * rule, mirroring `CHK_comment_author`.
	 */
	readonly create = z.object({
		...this.targetSchema(),

		type: this.validateEnum(
			CommentTypeEnum,
			this.getMessage('invalid_type'),
			{ required: false },
		),

		content: this.contentSchema(true),

		parent_id: this.validateId(this.getMessage('invalid_parent_id'), {
			required: false,
		}),

		guest_name: this.validateString(
			{
				invalid: this.getMessage('invalid_guest_name'),
				min_chars: this.getMessage('invalid_guest_name'),
				max_chars: this.getMessage('invalid_guest_name'),
			},
			{
				required: false,
				minChars: GUEST_NAME_MIN,
				maxChars: GUEST_NAME_MAX,
			},
		),

		guest_email: this.validateEmail(
			this.getMessage('invalid_guest_email'),
			{ required: false },
		),

		// A free-form string rather than a URL check: the value is displayed, never fetched, and
		// visitors type `example.com` as often as they type a scheme.
		guest_website: this.validateString(
			{
				invalid: this.getMessage('invalid_guest_website'),
				max_chars: this.getMessage('invalid_guest_website'),
			},
			{ required: false, maxChars: GUEST_WEBSITE_MAX },
		),
	});

	/**
	 * A visitor editing what they wrote. Only the text moves: the target, the parent and the type
	 * are what the comment *is*, and changing any of them after the fact would relocate a row the
	 * thread has already been rendered around.
	 *
	 * Addressed by id — unlike `rating`, where the target identifies the caller's single row, an
	 * author may hold many comments on one target, so nothing shorter addresses one. Ownership is
	 * enforced by `CommentQuery.filterByOwner` on the same query that loads it.
	 */
	readonly publicUpdate = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
		content: this.contentSchema(true),
	});

	readonly publicDelete = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	/** One comment by id, for a link that has to find its way back to it. */
	readonly publicRead = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	/**
	 * The thread as a visitor sees it. The target comes from the path, so it sits in `querySchema`
	 * (top level) rather than in `filter`; `parent_id` picks the level being read — omitted means
	 * the roots.
	 *
	 * `status` is deliberately absent: a public read only ever returns approved rows, and letting
	 * the caller name a status would expose the moderation queue.
	 */
	readonly publicFind = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.CREATED_AT,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.DESC,

		defaultLimit: Configuration.get('filter.limit'),
		defaultPage: 1,

		querySchema: this.targetSchema(),

		filterSchema: {
			parent_id: this.validateId(this.getMessage('invalid_parent_id'), {
				required: false,
			}),
			type: this.validateEnum(
				CommentTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			),
		},
	});

	readonly read = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly update = z
		.object({
			id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),

			content: this.contentSchema(false),

			type: this.validateEnum(
				CommentTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			),

			/*
			 * `.optional()` on top of `required: false`, which only widens the *type*:
			 * `validateBoolean` returns a schema that still rejects a missing key, so without
			 * this every partial update would have to carry `is_pinned`. Filters escape it
			 * because `validateFind` marks the whole filter object partial.
			 */
			is_pinned: this.validateBoolean(
				this.getMessage('invalid_is_pinned'),
				{ required: false },
			).optional(),
		})
		.refine((data) => hasAtLeastOneValue(data, paramsUpdateList), {
			message: this.getMessage('params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		});

	readonly delete = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	/**
	 * The moderation decision. `status` arrives in the path and the reason in the body — it is
	 * optional, and stored as written for the audit trail rather than shown to the author.
	 */
	readonly statusUpdate = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),

		status: this.validateEnum(
			CommentStatusEnum,
			this.getMessage('invalid_status'),
		),

		moderation_reason: this.validateString(
			{
				invalid: this.getMessage('invalid_moderation_reason'),
				max_chars: this.getMessage('invalid_moderation_reason'),
			},
			{ required: false, maxChars: MODERATION_REASON_MAX },
		),
	});

	readonly find = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.DESC,

		defaultLimit: Configuration.get('filter.limit'),
		defaultPage: 1,

		filterSchema: {
			entity_type: this.validateEnum(
				CommentEntityTypeEnum,
				this.getMessage('invalid_entity_type'),
				{ required: false },
			),
			entity_id: this.validateId(this.getMessage('invalid_entity_id'), {
				required: false,
			}),
			type: this.validateEnum(
				CommentTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			),
			status: this.validateEnum(
				CommentStatusEnum,
				this.getMessage('invalid_status'),
				{ required: false },
			),
			parent_id: this.validateId(this.getMessage('invalid_parent_id'), {
				required: false,
			}),
			user_id: this.validateId(
				this.getMessage('invalid_id', { name: 'user_id' }),
				{ required: false },
			),
			is_pinned: this.validateBoolean(
				this.getMessage('invalid_is_pinned'),
				{ required: false },
			),
			term: this.validateString(this.getMessage('invalid_term'), {
				required: false,
			}),
		},
	});
}
