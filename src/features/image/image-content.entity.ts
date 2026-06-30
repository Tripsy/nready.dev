import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ImageEntity from '@/features/image/image.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

export const ImageStorageEnum = {
	LOCAL: 'local',
	S3: 's3',
} as const;

export type ImageStorage =
	(typeof ImageStorageEnum)[keyof typeof ImageStorageEnum];

export const ImageMimeEnum = {
	JPEG: 'image/jpeg',
	PNG: 'image/png',
	GIF: 'image/gif',
	WEBP: 'image/webp',
	SVG: 'image/svg+xml',
} as const;

export type ImageMime = (typeof ImageMimeEnum)[keyof typeof ImageMimeEnum];

export type ImagePropertiesType = {
	width?: number; // pixel
	height?: number; // pixel
	size?: number; // in bytes
	mime?: ImageMime;
};

export type ImageAttributesType = {
	alt?: string;
	title?: string;
	description?: string;
};

export type ImageContentType = {
	language: string;
	storage: ImageStorage;
	path: string;
	properties?: ImagePropertiesType;
	attributes?: ImageAttributesType;
};

const ENTITY_TABLE_NAME = 'image_content';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Language-specific content for images',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_image_content_unique_per_lang', ['image_id', 'language'], {
	unique: true,
})
export default class ImageContentEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	image_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('text', {
		nullable: false,
		comment: 'The storage destination of the image (eg: local, s3, etc)',
	})
	@Index('IDX_image_content_storage', ['storage'])
	storage!: ImageStorage;

	@Column('text', { nullable: false })
	path!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Properties of the file',
	})
	properties!: ImagePropertiesType;

	@Column('jsonb', {
		nullable: true,
		comment: 'HTML element attributes (alt, title, etc.)',
	})
	attributes!: ImageAttributesType;

	// RELATIONS
	@ManyToOne('ImageEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'image_id' })
	image!: ImageEntity;
}
