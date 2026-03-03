import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type PlaceEntity from '@/features/place/place.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import type { StatusTransitions } from '@/shared/types/common.type';

export enum ClientStatusEnum {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	PENDING = 'pending',
}

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<ClientStatusEnum> = {
	[ClientStatusEnum.ACTIVE]: [ClientStatusEnum.INACTIVE],
	[ClientStatusEnum.INACTIVE]: [ClientStatusEnum.ACTIVE],
	[ClientStatusEnum.PENDING]: [
		ClientStatusEnum.ACTIVE,
		ClientStatusEnum.INACTIVE,
	],
};

export enum ClientTypeEnum {
	PERSON = 'person',
	COMPANY = 'company',
}

export type ClientIdentityData =
	| {
			client_type: ClientTypeEnum.COMPANY;
			company_name?: string | null;
			company_cui?: string | null;
			company_reg_com?: string | null;
	  }
	| {
			client_type: ClientTypeEnum.PERSON;
			person_cnp?: string | null;
	  };

const ENTITY_TABLE_NAME = 'client';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Stores client information for persons OR companies',
})
@Index('IDX_client_company_name_unique', ['company_name'], {
	unique: true,
	where: "company_name IS NOT NULL AND client_type = 'company'",
})
@Index('IDX_client_cui_unique', ['company_cui'], {
	unique: true,
	where: "company_cui IS NOT NULL AND client_type = 'company'",
})
@Index('IDX_client_reg_com_unique', ['company_reg_com'], {
	unique: true,
	where: "company_reg_com IS NOT NULL AND client_type = 'company'",
})
@Index('IDX_client_cnp_unique', ['person_cnp'], {
	unique: true,
	where: "person_cnp IS NOT NULL AND client_type = 'person'",
})
export default class ClientEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column({
		type: 'enum',
		enum: ClientTypeEnum,
		nullable: false,
	})
	client_type!: ClientTypeEnum;

	@Column({
		type: 'enum',
		enum: ClientStatusEnum,
		default: ClientStatusEnum.PENDING,
		nullable: false,
	})
	status!: ClientStatusEnum;

	// COMPANY FIELDS
	@Column('varchar', { nullable: true })
	company_name!: string | null;

	@Column('varchar', { nullable: true })
	company_cui!: string | null;

	@Column('varchar', { nullable: true })
	company_reg_com!: string | null;

	// PERSON FIELDS
	@Column('varchar', { nullable: true })
	person_name!: string | null;

	@Column('varchar', { nullable: true, select: false })
	person_cnp!: string | null;

	// FINANCIAL FIELDS
	@Column('varchar', { nullable: true })
	iban!: string | null;

	@Column('varchar', { nullable: true })
	bank_name!: string | null;

	// CONTACT
	@Column('varchar', { nullable: true })
	contact_name!: string | null;

	@Column('varchar', { nullable: true })
	contact_email!: string | null;

	@Column('varchar', { nullable: true })
	contact_phone!: string | null;

	// ADDRESS
	@Column('int', { nullable: true })
	address_country!: number | null;

	@Column('int', { nullable: true })
	address_region!: number | null;

	@Column('int', { nullable: true })
	address_city!: number | null;

	@Column('text', { nullable: true })
	address_info!: string | null;

	@Column('varchar', { nullable: true })
	address_postal_code!: number | null;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('PlaceEntity', {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'address_country' })
	country?: PlaceEntity | null;

	@ManyToOne('PlaceEntity', {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'address_region' })
	county?: PlaceEntity | null;

	@ManyToOne('PlaceEntity', {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'address_city' })
	city?: PlaceEntity | null;
}
