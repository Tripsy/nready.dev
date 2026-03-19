import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ClientEntity from '@/features/client/client.entity';
import type PlaceEntity from '@/features/place/place.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

export enum ClientAddressTypeEnum {
	BILLING = 'billing',
	DELIVERY = 'delivery',
}

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
	address_type!: ClientAddressTypeEnum;

	@Column('int', { nullable: true })
	address_city_id!: number | null;

	@Column('text')
	address_info!: string;

	@Column('varchar', { nullable: true })
	address_postal_code!: string | null;

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
	@JoinColumn({ name: 'address_city_id' })
	city?: PlaceEntity | null;
}
