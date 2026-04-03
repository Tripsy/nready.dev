import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	CategoryStatusEnum,
	CategoryTypeEnum,
} from '@/features/category/category.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export enum OrderByEnum {
	ID = 'id',
	LABEL = 'label',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

const validatorMessages = {
	invalid_label: lang('category.validation.invalid_label'),
	invalid_slug: lang('category.validation.invalid_slug'),
	invalid_description: lang('category.validation.invalid_description'),
	invalid_type: lang('category.validation.invalid_type'),
	invalid_parent_id: lang('category.validation.invalid_parent_id'),
	params_at_least_one: lang('shared.validation.params_at_least_one'),
	invalid_language: lang('shared.validation.invalid_language'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
	invalid_status: lang('shared.validation.invalid_status'),
};

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

	readonly update = z
		.object({
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

	readonly read = z.object({
		with_ancestors: this.validateBoolean(
			this.getMessage('invalid_boolean'),
			{ required: false },
		).default(false),
		with_children: this.validateBoolean(
			this.getMessage('invalid_boolean'),
			{ required: false },
		).default(false),
	});

	readonly find = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: Configuration.get('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
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
		// Used to force the `inactive` status update even if the category has active descendants
		force: this.validateBoolean(this.getMessage('invalid_boolean'), {
			required: false,
		}).default(false),
	});
}

export const categoryValidator = new CategoryValidator(validatorMessages);
