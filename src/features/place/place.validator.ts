import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { PlaceTypeEnum } from '@/features/place/place.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = ['type', 'code', 'parent_id'];

export enum OrderByEnum {
	ID = 'id',
}

export class PlaceValidator extends BaseValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	placeContentSchema() {
		return z.object({
			language: this.validateLanguage(),
			name: this.validateString(lang('place.validation.name_invalid')),
			type_label: this.validateString(
				lang('place.validation.type_label_invalid'),
			),
		});
	}

	create() {
		return z
			.object({
				type: this.validateEnum(
					PlaceTypeEnum,
					lang('place.validation.type_invalid'),
				),
				code: this.validateString(
					lang('place.validation.code_invalid'),
				).optional(),
				parent_id: z
					.number({ message: lang('shared.error.invalid_parent_id') })
					.optional(),
				content: this.placeContentSchema().array(),
			})
			.superRefine((data, ctx) => {
				if (
					data.type &&
					[PlaceTypeEnum.REGION, PlaceTypeEnum.CITY].includes(
						data.type,
					) &&
					!data.parent_id
				) {
					ctx.addIssue({
						path: ['parent_id'],
						message: lang('place.validation.required_parent_id'),
						code: 'custom',
					});
				}
			});
	}

	update() {
		return z
			.object({
				type: this.validateEnum(
					PlaceTypeEnum,
					lang('place.validation.type_invalid'),
				).optional(),
				code: this.validateString(
					lang('place.validation.code_invalid'),
				).optional(),
				parent_id: z
					.number({ message: lang('shared.error.invalid_parent_id') })
					.optional(),
				content: this.placeContentSchema().array().optional(),
			})
			.refine((data) => hasAtLeastOneValue(data), {
				message: lang('shared.validation.params_at_least_one', {
					params: [...paramsUpdateList, 'content'].join(', '),
				}),
				path: ['_global'],
			})
			.superRefine((data, ctx) => {
				if (
					data.type &&
					[PlaceTypeEnum.REGION, PlaceTypeEnum.CITY].includes(
						data.type,
					) &&
					!data.parent_id
				) {
					ctx.addIssue({
						path: ['parent_id'],
						message: lang('place.validation.required_parent_id'),
						code: 'custom',
					});
				}
			});
	}

	find() {
		return this.makeFindValidator({
			orderByEnum: OrderByEnum,
			defaultOrderBy: OrderByEnum.ID,

			directionEnum: OrderDirectionEnum,
			defaultDirection: OrderDirectionEnum.ASC,

			defaultLimit: this.defaultFilterLimit,
			defaultPage: 1,

			filterShape: {
				id: z.coerce
					.number({
						message: lang('shared.validation.invalid_number'),
					})
					.optional(),
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.optional(),
				type: z.enum(PlaceTypeEnum).optional(),
				language: this.validateLanguage().optional(),
				is_deleted: this.validateBoolean().default(false),
			},
		});
	}
}

export const placeValidator = new PlaceValidator();
