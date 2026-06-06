import { Column, Entity, Index } from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

export type ImageEntityType = 'product' | 'category' | 'brand';

export const ImageKindEnum = {
	LOGO: 'logo',
	GALLERY: 'gallery',
} as const;

export type ImageKind = (typeof ImageKindEnum)[keyof typeof ImageKindEnum];

const ENTITY_TABLE_NAME = 'image';

@Entity({ name: ENTITY_TABLE_NAME, schema: 'public' })
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_image_type_id', ['entity_type', 'entity_id', 'kind'])
export default class ImageEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('text', {
		nullable: false,
		comment:
			'The type of entity this image belongs to (product, category, brand, etc.)',
	})
	entity_type!: ImageEntityType;

	@Column('int', {
		nullable: false,
		comment: 'ID of the entity this image is linked to',
	})
	entity_id!: number;

	@Column('text', {
		nullable: false,
		comment: 'The kind of the image (eg: primary, logo, gallery, etc)',
	})
	kind!: ImageKind;

	@Column('boolean', { default: false })
	@Index('IDX_image_unique_main', ['entity_type', 'entity_id'], {
		unique: true,
	})
	is_main!: boolean;

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
}
