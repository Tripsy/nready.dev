import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import type ImageContentEntity from '@/features/image/image-content.entity';
import type { StatusTransitions } from '@/shared/types/common.type';

export const ImageSectionEnum = {
	PRODUCT: 'product',
	CATEGORY: 'category',
	BRAND: 'brand',
	ARTICLE: 'article',
} as const;

export type ImageSection =
	(typeof ImageSectionEnum)[keyof typeof ImageSectionEnum];

export const ImageTypeEnum = {
	LOGO: 'logo',
	GALLERY: 'gallery',
} as const;

export type ImageType = (typeof ImageTypeEnum)[keyof typeof ImageTypeEnum];

export const ImageStatusEnum = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
} as const;

export type ImageStatus =
	(typeof ImageStatusEnum)[keyof typeof ImageStatusEnum];

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<ImageStatus> = {
	[ImageStatusEnum.ACTIVE]: [ImageStatusEnum.INACTIVE],
	[ImageStatusEnum.INACTIVE]: [ImageStatusEnum.ACTIVE],
};

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

const ENTITY_TABLE_NAME = 'image';

@Entity({ name: ENTITY_TABLE_NAME, schema: 'public' })
@Index('IDX_image_type_id', ['entity_id', 'section', 'image_type'])
export default class ImageEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@Column({
		type: 'enum',
		enum: ImageSectionEnum,
		nullable: false,
		comment: 'The section this image belongs to',
	})
	section!: ImageSection;

	@Column('int', {
		nullable: false,
		comment: 'ID of the entity this image is linked to',
	})
	entity_id!: number;

	@Column({
		type: 'enum',
		enum: ImageTypeEnum,
		nullable: false,
		comment: 'The type of the image',
	})
	image_type!: ImageType;

	@Column({
		type: 'enum',
		enum: ImageStorageEnum,
		default: ImageStorageEnum.LOCAL,
		nullable: false,
		comment: 'The storage destination of the image',
	})
	@Index('IDX_image_storage')
	storage!: ImageStorage;

	@Column('text', { nullable: false })
	path!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Properties of the file',
	})
	properties!: ImagePropertiesType | null;

	@Column({
		type: 'enum',
		enum: ImageStatusEnum,
		default: ImageStatusEnum.ACTIVE,
		nullable: false,
	})
	status!: ImageStatus;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Order/position of the image within the entity type',
	})
	sort_order!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	// RELATIONS
	@OneToMany(
		'ImageContentEntity',
		(content: ImageContentEntity) => content.image,
	)
	contents!: ImageContentEntity[];
}
