import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { PlaceTypeEnum } from '@/features/place/place.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = ['place_type', 'code', 'parent_id'];

export enum OrderByEnum {
	ID = 'id',
}

const validatorMessages = {
	invalid_name: lang('place.validation.invalid_name'),
	invalid_place_type: lang('place.validation.invalid_place_type'),
	code_invalid: lang('place.validation.code_invalid'),
	invalid_parent_id: lang('place.validation.invalid_parent_id'),
	required_parent_id: lang('place.validation.required_parent_id'),
	params_at_least_one: lang('shared.validation.params_at_least_one'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
	invalid_language: lang('shared.validation.invalid_language'),
};

export class PlaceValidator extends BaseValidator<typeof validatorMessages> {
	contentSchema() {
		return z.object({
			language: this.validateLanguage(),
			name: this.validateString(this.getMessage('invalid_name')),
			type_label: this.validateString(
				lang('place.validation.invalid_type_label'),
			),
		});
	}

	readonly create = z
		.object({
			place_type: this.validateEnum(
				PlaceTypeEnum,
				this.getMessage('invalid_place_type'),
			),
			code: this.validateString(this.getMessage('code_invalid'), {
				required: false,
			}),
			parent_id: this.validateId(this.getMessage('invalid_parent_id'), {
				required: false,
			}),
			content: this.contentSchema().array(),
		})
		.superRefine((data, ctx) => {
			if (
				data.place_type &&
				[PlaceTypeEnum.REGION, PlaceTypeEnum.CITY].includes(
					data.place_type,
				) &&
				!data.parent_id
			) {
				ctx.addIssue({
					path: ['parent_id'],
					message: this.getMessage('required_parent_id'),
					code: 'custom',
				});
			}
		});

	readonly update = z
		.object({
			place_type: this.validateEnum(
				PlaceTypeEnum,
				this.getMessage('invalid_place_type'),
				{ required: false },
			),
			code: this.validateString(this.getMessage('code_invalid'), {
				required: false,
			}),
			parent_id: this.validateId(this.getMessage('invalid_parent_id'), {
				required: false,
			}),
			content: this.contentSchema().array().optional(),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: this.getMessage('params_at_least_one', {
				params: [...paramsUpdateList, 'content'].join(', '),
			}),
			path: ['_global'],
		})
		.superRefine((data, ctx) => {
			if (
				data.place_type &&
				[PlaceTypeEnum.REGION, PlaceTypeEnum.CITY].includes(
					data.place_type,
				) &&
				!data.parent_id
			) {
				ctx.addIssue({
					path: ['parent_id'],
					message: this.getMessage('required_parent_id'),
					code: 'custom',
				});
			}
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
			term: this.validateString(this.getMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			place_type: this.validateEnum(
				PlaceTypeEnum,
				this.getMessage('invalid_place_type'),
				{ required: false },
			),
			language: this.validateLanguage(
				this.getMessage('invalid_language'),
				{ required: false },
			),
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}

export const placeValidator = new PlaceValidator(validatorMessages);
