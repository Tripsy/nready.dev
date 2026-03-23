import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { BrandStatusEnum, BrandTypeEnum } from '@/features/brand/brand.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = ['name', 'slug', 'type'];

export enum OrderByEnum {
	ID = 'id',
}

const validatorMessages = {
	invalid_description: lang('brand.validation.invalid_description'),
	invalid_name: lang('brand.validation.invalid_name'),
	invalid_slug: lang('brand.validation.invalid_slug'),
	invalid_type: lang('brand.validation.invalid_type'),
	invalid_status: lang('brand.validation.invalid_status'),
	invalid_number: lang('shared.validation.invalid_number'),
	invalid_string: lang('shared.validation.invalid_string'),
	invalid_language: lang('shared.validation.invalid_language'),
	invalid_boolean: lang('shared.validation.invalid_boolean'),
	invalid_meta_title: lang('shared.validation.invalid_meta_title'),
	invalid_meta_description: lang(
		'shared.validation.invalid_meta_description',
	),
	invalid_meta_keywords: lang('shared.validation.invalid_meta_keywords'),
};

type BrandValidatorMessages = typeof validatorMessages;

export class BrandValidator extends BaseValidator<BrandValidatorMessages> {
	readonly contentSchema = z.object({
		language: this.validateLanguage(this.useMessage('invalid_language')),
		description: this.validateString(
			this.useMessage('invalid_description'),
			{ required: false },
		),
		meta: this.validateMeta({
			invalid_meta_title: this.useMessage('invalid_meta_title'),
			invalid_meta_description: this.useMessage(
				'invalid_meta_description',
			),
			invalid_meta_keywords: this.useMessage('invalid_meta_keywords'),
		}),
	});

	readonly create = z.object({
		name: this.validateString(this.useMessage('invalid_name')),
		slug: this.validateString(this.useMessage('invalid_slug')).transform(
			(val) => val.trim().toLowerCase(),
		),
		type: this.validateEnum(BrandTypeEnum, this.useMessage('invalid_type')),
		content: this.contentSchema.array(),
	});

	readonly update = z
		.object({
			name: this.validateString(this.useMessage('invalid_name'), {
				required: false,
			}),
			slug: this.validateString(this.useMessage('invalid_slug'), {
				required: false,
			}).transform((val) => val?.trim().toLowerCase()),
			type: this.validateEnum(
				BrandTypeEnum,
				this.useMessage('invalid_type'),
				{ required: false },
			),
			content: this.contentSchema.array().optional(),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: lang('shared.validation.params_at_least_one', {
				params: [...paramsUpdateList, 'content'].join(', '),
			}),
			path: ['_global'],
		});

	readonly find = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: Configuration.get('filter.limit') as number,
		defaultPage: 1,

		filterShape: {
			id: this.validateNumber(this.useMessage('invalid_number'), {
				required: false,
			}),
			term: this.validateString(this.useMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength') as number,
			}),
			type: this.validateEnum(
				BrandTypeEnum,
				this.useMessage('invalid_type'),
				{ required: false },
			),
			status: this.validateEnum(
				BrandStatusEnum,
				this.useMessage('invalid_status'),
				{ required: false },
			),
			language: this.validateLanguage(
				this.useMessage('invalid_language'),
				{ required: false },
			),
			is_deleted: this.validateBoolean(
				this.useMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});

	readonly orderUpdate = z.object({
		positions: z
			.array(
				z.number({
					message: this.useMessage('invalid_number'),
				}),
			)
			.min(2, {
				message: lang('shared.validation.array_min', {
					length: '2',
				}),
			}),
	});
}

export const brandValidator = new BrandValidator(validatorMessages);
