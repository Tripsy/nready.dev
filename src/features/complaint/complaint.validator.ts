import { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import {
	ComplaintEntityTypeEnum,
	ComplaintReasonEnum,
} from '@/features/complaint/complaint.entity';
import { hasAtLeastOneValue } from '@/helpers/objects.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

export const OrderByEnum = {
	ID: 'id',
	CREATED_AT: 'created_at',
	RESOLVED_AT: 'resolved_at',
} as const;

export const COMPLAINT_DESCRIPTION_MIN = 2;
export const COMPLAINT_DESCRIPTION_MAX = 2000;

/**
 * What the reporter may still change on a complaint they filed. The target is not among them: it
 * is what the complaint *is*, and moving it would file a different report under the row a moderator
 * may already be reading.
 */
export const paramsPublicUpdateList: string[] = ['reason', 'description'];

const validatorMessages = [
	...sharedValidatorMessages,
	'invalid_entity_type',
	'invalid_entity_id',
	'invalid_reason',
	'invalid_description',
	'invalid_is_resolved',
	'invalid_term',
] as const;

export class ComplaintValidator extends BaseValidator<
	typeof validatorMessages
> {
	/** The polymorphic target, shared by every schema that addresses one. */
	private targetSchema() {
		return {
			entity_type: this.validateEnum(
				ComplaintEntityTypeEnum,
				this.getMessage('invalid_entity_type'),
			),
			entity_id: this.validateId(this.getMessage('invalid_entity_id')),
		};
	}

	private descriptionSchema() {
		return this.validateString(
			{
				invalid: this.getMessage('invalid_description'),
				min_chars: this.getMessage('invalid_description'),
				max_chars: this.getMessage('invalid_description'),
			},
			{
				required: false,
				minChars: COMPLAINT_DESCRIPTION_MIN,
				maxChars: COMPLAINT_DESCRIPTION_MAX,
			},
		);
	}

	/**
	 * What a reader files. The reporter is never in the body — it is the authenticated caller — and
	 * `description` stays optional: the reason alone is a complete report, and a required free-text
	 * field is one people fill with a full stop.
	 */
	readonly create = z.object({
		...this.targetSchema(),

		reason: this.validateEnum(
			ComplaintReasonEnum,
			this.getMessage('invalid_reason'),
		),

		description: this.descriptionSchema(),
	});

	/**
	 * The reporter amending their own complaint. Addressed by target rather than by id: one
	 * complaint per reporter per target (`UQ_complaint_user`), so the target plus the caller names
	 * exactly one row, and no id the caller could name has to be checked against them afterwards.
	 */
	readonly publicUpdate = z
		.object({
			...this.targetSchema(),

			reason: this.validateEnum(
				ComplaintReasonEnum,
				this.getMessage('invalid_reason'),
				{ required: false },
			),

			description: this.descriptionSchema(),
		})
		.refine((data) => hasAtLeastOneValue(data, paramsPublicUpdateList), {
			message: this.getMessage('params_at_least_one', {
				params: paramsPublicUpdateList.join(', '),
			}),
			path: ['_global'],
		});

	readonly publicDelete = z.object(this.targetSchema());

	/** What the caller themselves filed against one target, so a reader is not asked to file twice. */
	readonly publicRead = z.object(this.targetSchema());

	readonly read = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly delete = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly restore = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	/**
	 * The moderation decision. Which way it goes is the endpoint, not a field: `validateBoolean`
	 * treats a required boolean as "must be true" — it refines `val === true` — so a body carrying
	 * `is_resolved: false` could never validate, and reopening would answer 422 forever.
	 */
	readonly resolveUpdate = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
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
				ComplaintEntityTypeEnum,
				this.getMessage('invalid_entity_type'),
				{ required: false },
			),
			entity_id: this.validateId(this.getMessage('invalid_entity_id'), {
				required: false,
			}),
			reason: this.validateEnum(
				ComplaintReasonEnum,
				this.getMessage('invalid_reason'),
				{ required: false },
			),
			user_id: this.validateId(
				this.getMessage('invalid_id', { name: 'user_id' }),
				{ required: false },
			),
			resolved_by: this.validateId(
				this.getMessage('invalid_id', { name: 'resolved_by' }),
				{ required: false },
			),
			is_resolved: this.validateBoolean(
				this.getMessage('invalid_is_resolved'),
				{ required: false },
			),
			term: this.validateString(this.getMessage('invalid_term'), {
				required: false,
			}),
			/*
			 * The dashboard's show-deleted toggle. Defaulted rather than left optional, so the
			 * service always has a boolean to combine with the caller's `allowDeleted` — an
			 * undefined here would reach `withDeleted()` and fall back to its `true` default,
			 * showing withdrawn complaints to a listing that never asked for them.
			 */
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}
