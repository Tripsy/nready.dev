import { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import { BrandStatusEnum, BrandTypeEnum } from '@/features/brand/brand.entity';
import { hasAtLeastOneValue } from '@/helpers/objects.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = ['name', 'slug', 'brand_type'];

export const OrderByEnum = {
	ID: 'id',
	NAME: 'name',
	SORT_ORDER: 'sort_order',
} as const;

const validatorMessages = [
	...sharedValidatorMessages,
	'invalid_description',
	'invalid_name',
	'invalid_slug',
	'invalid_brand_type',
] as const;

export class BrandValidator extends BaseValidator<typeof validatorMessages> {
	readonly contentsSchema = z.object({
		language: this.validateLanguage(this.getMessage('invalid_language')),
		description: this.validateString(
			this.getMessage('invalid_description'),
			{ required: false },
		),
		meta: this.validateMeta({
			invalid_meta_title: this.getMessage('invalid_meta_title'),
			invalid_meta_description: this.getMessage(
				'invalid_meta_description',
			),
			invalid_meta_keywords: this.getMessage('invalid_meta_keywords'),
		}),
	});

	readonly create = z.object({
		name: this.validateString(this.getMessage('invalid_name')),
		slug: this.validateString(this.getMessage('invalid_slug')).transform(
			(val) => val.trim().toLowerCase(),
		),
		brand_type: this.validateEnum(
			BrandTypeEnum,
			this.getMessage('invalid_brand_type'),
		),
		contents: this.contentsSchema
			.array()
			.min(1, this.getMessage('invalid_contents'))
			.refine(
				(contents) => {
					const languages = contents.map((c) => c.language);

					return new Set(languages).size === languages.length;
				},
				{ message: this.getMessage('duplicate_contents') },
			),
	});

	readonly read = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
		language: this.validateLanguage(this.getMessage('invalid_language'), {
			required: false,
		}),
	});

	readonly update = z
		.object({
			id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
			name: this.validateString(this.getMessage('invalid_name'), {
				required: false,
			}),
			slug: this.validateString(this.getMessage('invalid_slug'), {
				required: false,
			}).transform((val) => val?.trim().toLowerCase()),
			brand_type: this.validateEnum(
				BrandTypeEnum,
				this.getMessage('invalid_brand_type'),
				{ required: false },
			),
			contents: this.contentsSchema
				.array()
				.refine(
					(contents) => {
						const languages = contents.map((c) => c.language);

						return new Set(languages).size === languages.length;
					},
					{ message: this.getMessage('duplicate_contents') },
				)
				.optional(),
		})
		.refine((data) => hasAtLeastOneValue(data), {
			message: this.getMessage('params_at_least_one', {
				params: [...paramsUpdateList, 'contents'].join(', '),
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

		defaultLimit: Configuration.get('filter.limit'),
		defaultPage: 1,

		filterSchema: {
			id: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
			}),
			term: this.validateString(this.getMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength'),
			}),
			brand_type: this.validateEnum(
				BrandTypeEnum,
				this.getMessage('invalid_brand_type'),
				{ required: false },
			),
			status: this.validateEnum(
				BrandStatusEnum,
				this.getMessage('invalid_status'),
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

	readonly statusUpdate = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
		status: this.validateEnum(
			BrandStatusEnum,
			this.getMessage('invalid_status'),
		),
	});

	readonly orderUpdate = z.object({
		brand_type: this.validateEnum(
			BrandTypeEnum,
			this.getMessage('invalid_brand_type'),
		),
		positions: z
			.array(
				z.number({
					message: this.getMessage('invalid_number'),
				}),
			)
			.min(2, {
				message: this.getMessage('array_min', {
					length: '2',
				}),
			}),
	});
}
