import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ClientEntity from '@/features/client/client.entity';
import type PlaceEntity from '@/features/place/place.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

export const ClientAddressTypeEnum = {
	BILLING: 'billing',
	DELIVERY: 'delivery',
} as const;

export type ClientAddressType =
	(typeof ClientAddressTypeEnum)[keyof typeof ClientAddressTypeEnum];

const ENTITY_TABLE_NAME = 'client_address';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Client addresses',
})
export default class ClientAddressEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	@Index('IDX_client_address_client_id')
	client_id!: number;

	@Column({
		type: 'enum',
		enum: ClientAddressTypeEnum,
		nullable: false,
	})
	@Index('IDX_client_address_address_type')
	address_type!: ClientAddressType;

	@Column('int', { nullable: true })
	city_id!: number | null;

	@Column('text')
	details!: string;

	@Column('varchar', { nullable: true })
	postal_code!: string | null;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('ClientEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'client_id' })
	client!: ClientEntity;

	@ManyToOne('PlaceEntity', {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'city_id' })
	city?: PlaceEntity | null;
}
