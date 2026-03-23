import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import type PlaceContentEntity from '@/features/place/place-content.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { PlaceTypeEnum } from '@/shared/types/place.type';

export { PlaceTypeEnum };

export type PlaceContentType = {
	language: string;
	name: string;
	type_label: string;
};

const ENTITY_TABLE_NAME = 'place';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Places (countries, regions, cities)',
})
export default class PlaceEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('enum', {
		enum: PlaceTypeEnum,
		default: PlaceTypeEnum.COUNTRY,
		nullable: false,
	})
	place_type!: PlaceTypeEnum;

	@Column('int', { nullable: true })
	@Index('IDX_place_parent_id')
	parent_id?: number; // country -> null, region -> country_id, city -> region_id or country_id

	@Column('varchar', { length: 3, nullable: true, comment: 'Abbreviation' })
	@Index('IDX_place_code')
	code?: string;

	// RELATIONS
	@ManyToOne(
		() => PlaceEntity,
		(place) => place.children,
		{ onDelete: 'SET NULL' },
	)
	@JoinColumn({ name: 'parent_id' })
	parent?: PlaceEntity;

	@OneToMany(
		() => PlaceEntity,
		(place) => place.parent,
	)
	children!: PlaceEntity[];

	@OneToMany(
		'PlaceContentEntity',
		(content: PlaceContentEntity) => content.place,
	)
	contents!: PlaceContentEntity[];
}
