import { Column, Entity, Index, OneToMany } from 'typeorm';
import type BrandContentEntity from '@/features/brand/brand-content.entity';
import {
	EntityAbstract,
	type PageMeta,
} from '@/shared/abstracts/entity.abstract';
import type { StatusTransitions } from '@/shared/types/common.type';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

export const BrandStatusEnum = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
} as const;

export type BrandStatus =
	(typeof BrandStatusEnum)[keyof typeof BrandStatusEnum];

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<BrandStatus> = {
	[BrandStatusEnum.ACTIVE]: [BrandStatusEnum.INACTIVE],
	[BrandStatusEnum.INACTIVE]: [BrandStatusEnum.ACTIVE],
};

export const BrandTypeEnum = {
	PRODUCT: 'product',
} as const;

export type BrandType = (typeof BrandTypeEnum)[keyof typeof BrandTypeEnum];

export type BrandContentType = {
	language: string;
	description?: string;
	meta: PageMeta;
};

const ENTITY_TABLE_NAME = 'brand';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_brand_slug', ['slug', 'brand_type'], {
	unique: true,
})
export default class BrandEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('varchar', { nullable: false })
	name!: string;

	@Column('varchar', { nullable: false })
	slug!: string;

	@Column({
		type: 'enum',
		enum: BrandStatusEnum,
		default: BrandStatusEnum.ACTIVE,
		nullable: false,
	})
	status!: BrandStatus;

	@Column({
		type: 'enum',
		enum: BrandTypeEnum,
		default: BrandTypeEnum.PRODUCT,
		nullable: false,
		comment: 'Specifies the entity type this brand belongs to',
	})
	brand_type!: BrandType;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Order/position of the brand in a listing',
	})
	sort_order!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	// RELATIONS
	@OneToMany(
		'BrandContentEntity',
		(content: BrandContentEntity) => content.brand,
	)
	contents!: BrandContentEntity[];
}
