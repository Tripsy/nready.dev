import { Column, Entity, Index } from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';
import type { StatusTransitions } from '@/shared/types/common.type';

export const VendorStatusEnum = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	PENDING: 'pending',
} as const;

export type VendorStatus =
	(typeof VendorStatusEnum)[keyof typeof VendorStatusEnum];

/**
 * What the vendor sells, which is also what it is billed for. A fleet operator's fuel seller and
 * a catalog's goods distributor are both `supplier`; insurance, tolls and telematics are
 * `provider`. Deliberately about the nature of the supply, not about the industry.
 */
export const VendorTypeEnum = {
	SUPPLIER: 'supplier', // Goods
	PROVIDER: 'provider', // Services
} as const;

export type VendorType = (typeof VendorTypeEnum)[keyof typeof VendorTypeEnum];

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<VendorStatus> = {
	[VendorStatusEnum.ACTIVE]: [VendorStatusEnum.INACTIVE],
	[VendorStatusEnum.INACTIVE]: [VendorStatusEnum.ACTIVE],
	[VendorStatusEnum.PENDING]: [
		VendorStatusEnum.ACTIVE,
		VendorStatusEnum.INACTIVE,
	],
};

const ENTITY_TABLE_NAME = 'vendor';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Store vendors',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
export default class VendorEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('varchar', { nullable: false })
	@Index('IDX_vendor_name')
	name!: string;

	@Column({
		type: 'enum',
		enum: VendorTypeEnum,
		default: VendorTypeEnum.SUPPLIER,
		nullable: false,
	})
	@Index('IDX_vendor_type')
	type!: VendorType;

	@Column({
		type: 'enum',
		enum: VendorStatusEnum,
		default: VendorStatusEnum.PENDING,
		nullable: false,
	})
	@Index('IDX_vendor_status')
	status!: VendorStatus;
}
