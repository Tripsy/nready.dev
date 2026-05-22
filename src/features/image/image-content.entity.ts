import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import ImageEntity from './image.entity';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

export type ImageFilePropsType = {
	width?: number; // pixel
	height?: number; // pixel
	size?: number; // in bytes
	mime?:
		| 'image/jpeg'
		| 'image/png'
		| 'image/gif'
		| 'image/webp'
		| 'image/svg+xml';
	name?: string;
	extension?: 'jpeg' | 'png' | 'gif' | 'webp' | 'svg';
	path?: string; // If stored locally
	url?: string;
};

export type ImageElementAttrsType = {
	alt?: string;
	title?: string;
};

const ENTITY_TABLE_NAME = 'image_content';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Language-specific content for images',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_image_content_unique_per_lang', ['image_id', 'language'])
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

	@Column('jsonb', {
		nullable: false,
		comment: 'Properties of the image file',
	})
	fileProps!: ImageFilePropsType;

	@Column('jsonb', {
		nullable: true,
		comment: 'HTML element attributes (alt, title, etc.)',
	})
	elementAttrs!: ImageElementAttrsType;

	// RELATIONS
	@ManyToOne(() => ImageEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'image_id' })
	image!: ImageEntity;
}
