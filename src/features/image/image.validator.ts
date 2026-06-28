import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	ImageSectionEnum,
	ImageStatusEnum,
	ImageTypeEnum,
} from '@/features/image/image.entity';
import {
	ImageMimeEnum,
	ImageStorageEnum,
} from '@/features/image/image-content.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = ['image_type'];

export const OrderByEnum = {
	ID: 'id',
	SORT_ORDER: 'sort_order',
} as const;

const validatorMessages = [
	...sharedValidatorMessages,
	'invalid_image_type',
	'invalid_storage',
	'invalid_path',
	'invalid_width',
	'invalid_height',
	'invalid_size',
	'invalid_mime',
	'invalid_alt',
	'invalid_title',
	'invalid_description',
	'invalid_entity_id',
	'invalid_section',
] as const;

export class ImageValidator extends BaseValidator<typeof validatorMessages> {
	protected validateProperties(
		message = {
			invalid_width: 'Invalid width',
			invalid_height: 'Invalid height',
			invalid_size: 'Invalid file size',
			invalid_mime: 'Invalid mime type',
		},
	) {
		return z.preprocess(
			(val) => val ?? {},
			z.object({
				width: this.validateNumber(message.invalid_width, {
					required: false,
				}),
				height: this.validateNumber(message.invalid_width, {
					required: false,
				}),
				size: this.validateNumber(message.invalid_width),
				mime: this.validateEnum(ImageMimeEnum, message.invalid_mime),
			}),
		);
	}

	protected validateAttributes(
		message = {
			invalid_alt: 'Invalid alt',
			invalid_title: 'Invalid title',
			invalid_description: 'Invalid description',
		},
	) {
		return z.preprocess(
			(val) => val ?? {},
			z.object({
				alt: this.validateString(message.invalid_alt, {
					required: false,
				}),
				title: this.validateString(message.invalid_title, {
					required: false,
				}),
				description: this.validateString(message.invalid_description, {
					required: false,
				}),
			}),
		);
	}

	readonly contentsSchema = z.object({
		language: this.validateLanguage(this.getMessage('invalid_language')),
		storage: this.validateEnum(
			ImageStorageEnum,
			this.getMessage('invalid_storage'),
		),
		path: this.validateString(this.getMessage('invalid_path')),
		properties: this.validateProperties({
			invalid_width: this.getMessage('invalid_width'),
			invalid_height: this.getMessage('invalid_height'),
			invalid_size: this.getMessage('invalid_size'),
			invalid_mime: this.getMessage('invalid_mime'),
		}),
		attributes: this.validateAttributes({
			invalid_alt: this.getMessage('invalid_alt'),
			invalid_title: this.getMessage('invalid_title'),
			invalid_description: this.getMessage('invalid_description'),
		}),
	});

	readonly create = z.object({
		section: this.validateEnum(
			ImageSectionEnum,
			this.getMessage('invalid_section'),
		),
		entity_id: this.validateId(this.getMessage('invalid_entity_id')),
		image_type: this.validateEnum(
			ImageTypeEnum,
			this.getMessage('invalid_image_type'),
		),
		contents: this.contentsSchema.array(),
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
			image_type: this.validateEnum(
				ImageTypeEnum,
				this.getMessage('invalid_image_type'),
				{ required: false },
			),
			contents: this.contentsSchema.array().optional(),
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

		defaultLimit: Configuration.get('filter.limit') as number,
		defaultPage: 1,

		filterSchema: {
			id: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
			}),
			section: this.validateEnum(
				ImageSectionEnum,
				this.getMessage('invalid_section'),
				{ required: false },
			),
			entity_id: this.validateId(this.getMessage('invalid_entity_id'), {
				required: false,
			}),
			image_type: this.validateEnum(
				ImageTypeEnum,
				this.getMessage('invalid_image_type'),
				{ required: false },
			),
			status: this.validateEnum(
				ImageStatusEnum,
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
			ImageStatusEnum,
			this.getMessage('invalid_status'),
		),
	});

	readonly orderUpdate = z.object({
		section: this.validateEnum(
			ImageSectionEnum,
			this.getMessage('invalid_section'),
		),
		entity_id: this.validateId(this.getMessage('invalid_entity_id')),
		positions: z
			.array(
				z.number({
					message: this.getMessage('invalid_number'),
				}),
			)
			.min(2, {
				message: lang('shared.validation.array_min', {
					length: '2',
				}),
			}),
	});
}
