import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import type ImageEntity from '@/features/image/image.entity';

export type ImageContentType = {
	language: string;
	title?: string;
	description?: string;
};

const ENTITY_TABLE_NAME = 'image_content';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Language-specific content for images',
})
@Index('IDX_image_content_unique_per_lang', ['image_id', 'language'], {
	unique: true,
})
export default class ImageContentEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@Column('int', { nullable: false })
	image_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('text', { nullable: true })
	title!: string | null;

	@Column('text', { nullable: true })
	description!: string | null;

	// RELATIONS
	@ManyToOne('ImageEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'image_id' })
	image!: ImageEntity;
}
