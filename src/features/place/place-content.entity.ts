import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type PlaceEntity from '@/features/place/place.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

export type PlaceContentType = {
	language: string;
	name: string;
	type_label: string;
};

const ENTITY_TABLE_NAME = 'place_content';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Language-specific content for places',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_place_content_unique_per_lang', ['place_id', 'language'], {
	unique: true,
})
export default class PlaceContentEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	place_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('varchar', { nullable: false })
	name!: string;

	@Column('varchar', {
		nullable: false,
		comment: 'ex: Country, Region, City, Oras, Judet',
	})
	type_label!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	// RELATIONS
	@ManyToOne('PlaceEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'place_id' })
	place!: PlaceEntity;
}
