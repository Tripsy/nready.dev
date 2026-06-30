import type ImageEntity from '@/features/image/image.entity';
import {
	ImageSectionEnum,
	ImageStatusEnum,
	ImageTypeEnum,
} from '@/features/image/image.entity';
import { ImageValidator, OrderByEnum } from '@/features/image/image.validator';
import {
	ImageMimeEnum,
	ImageStorageEnum,
} from '@/features/image/image-content.entity';
import { createPastDate } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

const imageValidator = new ImageValidator('image');

export function getImageEntityMock(): ImageEntity {
	return {
		id: 1,
		section: ImageSectionEnum.PRODUCT,
		entity_id: 1,
		image_type: ImageTypeEnum.GALLERY,
		status: ImageStatusEnum.ACTIVE,
		sort_order: 0,
		details: null,
		created_at: createPastDate(86400),
		updated_at: null,
		deleted_at: null,
		contents: [],
	};
}

export const imageInputPayloads = {
	create: {
		section: ImageSectionEnum.PRODUCT,
		entity_id: 1,
		image_type: ImageTypeEnum.GALLERY,
		contents: [
			{
				language: 'en',
				storage: ImageStorageEnum.LOCAL,
				path: '/products/pepsi.jpg',
				properties: {
					width: 240,
					height: 240,
					size: 1048576,
					mime: ImageMimeEnum.JPEG,
				},
				attributes: {
					alt: 'Pepsi Commercial',
					title: 'Pepsi Commercial',
					description: 'Pepsi Commercial',
				},
			},
		],
	},
	update: {
		id: 1,
		section: ImageSectionEnum.PRODUCT,
		entity_id: 1,
		image_type: ImageTypeEnum.GALLERY,
		contents: [
			{
				language: 'en',
				storage: ImageStorageEnum.LOCAL,
				path: '/products/pepsi.jpg',
				properties: {
					width: 240,
					height: 240,
					size: 1048576,
					mime: ImageMimeEnum.JPEG,
				},
				attributes: {
					alt: 'Pepsi Commercial',
					title: 'Pepsi Commercial',
					description: 'Pepsi Commercial',
				},
			},
		],
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			section: ImageSectionEnum.PRODUCT,
			image_type: ImageTypeEnum.GALLERY,
			status: ImageStatusEnum.ACTIVE,
			language: 'en',
			is_deleted: false,
		},
	},
	orderUpdate: {
		section: ImageSectionEnum.PRODUCT,
		entity_id: 1,
		positions: [1, 2],
	},
};

export const imageOutputPayloads = {
	create: imageValidator.create.parse(imageInputPayloads.create),
	update: imageValidator.update.parse(imageInputPayloads.update),
	find: imageValidator.find.parse(imageInputPayloads.find),
};
