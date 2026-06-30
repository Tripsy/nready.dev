import { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import {
	CategoryStatusEnum,
	CategoryTypeEnum,
} from '@/features/category/category.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

export const OrderByEnum = {
	ID: 'id',
	LABEL: 'label',
	CREATED_AT: 'created_at',
	UPDATED_AT: 'updated_at',
} as const;

const validatorMessages = [
	...sharedValidatorMessages,
	'invalid_label',
	'invalid_slug',
	'invalid_description',
	'invalid_type',
	'invalid_parent_id',
] as const;

export class CategoryValidator extends BaseValidator<typeof validatorMessages> {
	private contentsSchema() {
		return z.object({
			language: this.validateLanguage(
				this.getMessage('invalid_language'),
			),
			label: this.validateString(this.getMessage('invalid_label')),
			slug: this.validateString(
				this.getMessage('invalid_slug'),
			).transform((val) => val.trim().toLowerCase()),
			meta: this.validateMeta(),
			description: this.validateString(
				this.getMessage('invalid_description'),
			),
		});
	}

	readonly create = z.object({
		type: this.validateEnum(
			CategoryTypeEnum,
			this.getMessage('invalid_type'),
		),
		parent_id: this.validateId(this.getMessage('invalid_parent_id'), {
			required: false,
		}),
		contents: this.contentsSchema().array(),
	});

	readonly read = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
		with_ancestors: this.validateBoolean(
			this.getMessage('invalid_boolean'),
			{ required: false },
		).default(false),
		with_children: this.validateBoolean(
			this.getMessage('invalid_boolean'),
			{ required: false },
		).default(false),
		language: this.validateLanguage(this.getMessage('invalid_language'), {
			required: false,
		}),
	});

	readonly update = z
		.object({
			id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
			parent_id: this.validateId(this.getMessage('invalid_parent_id'), {
				required: false,
			}),
			contents: this.contentsSchema().array().optional(),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: this.getMessage('params_at_least_one', {
				params: ['parent_id', 'contents'].join(', '),
			}),
			path: ['_global'],
		});

	readonly delete = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly restore = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly find = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: Configuration.get('filter.limit') as number,
		defaultPage: 1,

		filterSchema: {
			id: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
			}),
			language: this.validateLanguage(
				this.getMessage('invalid_language'),
				{ required: false },
			),
			type: this.validateEnum(
				CategoryTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			).default(CategoryTypeEnum.ARTICLE),
			status: this.validateEnum(
				CategoryStatusEnum,
				this.getMessage('invalid_status'),
				{ required: false },
			),
			term: this.validateString(this.getMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});

	readonly statusUpdate = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
		status: this.validateEnum(
			CategoryStatusEnum,
			this.getMessage('invalid_status'),
		),
		// Used to force the `inactive` status update even if the category has active descendants
		force: this.validateBoolean(this.getMessage('invalid_boolean'), {
			required: false,
		}).default(false),
	});
}
