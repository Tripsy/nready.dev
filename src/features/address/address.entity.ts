import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type PlaceEntity from '@/features/place/place.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

const ENTITY_TABLE_NAME = 'address';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Addresses',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
export default class AddressEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: true })
	city_id!: number | null;

	@Column('text')
	details!: string;

	@Column('varchar', { nullable: true })
	postal_code!: string | null;

	// RELATIONS
	@ManyToOne('PlaceEntity', {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'city_id' })
	city?: PlaceEntity | null;
}
