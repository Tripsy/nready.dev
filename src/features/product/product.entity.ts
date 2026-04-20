import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import type BrandEntity from '@/features/brand/brand.entity';
import type ProductAttributeEntity from '@/features/product/product-attribute.entity';
import type ProductCategoryEntity from '@/features/product/product-category.entity';
import type ProductTagEntity from '@/features/product/product-tag.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

export const ProductWorkflowEnum = {
	DRAFT: 'draft', // Initial creation
	PENDING_REVIEW: 'pending_review', // Awaiting approval
	REVISION_REQUIRED: 'revision_required', // Needs changes
	READY: 'ready', // Ready to be sold
} as const;

export type ProductWorkflow =
	(typeof ProductWorkflowEnum)[keyof typeof ProductWorkflowEnum];

export const ProductSaleStatusEnum = {
	ON_SALE: 'on_sale',
	COMING_SOON: 'coming_soon', // Updated via cron based on available_from
	SEASONAL: 'seasonal', // Updated via cron based on available_from / available_until
	DISCONTINUED: 'discontinued', // No longer manufactured
	ARCHIVED: 'archived', // Historical record only
} as const;

export type ProductSaleStatus =
	(typeof ProductSaleStatusEnum)[keyof typeof ProductSaleStatusEnum];

export const ProductTypeEnum = {
	PHYSICAL: 'physical',
	DIGITAL: 'digital',
	SERVICE: 'service',
} as const;

export type ProductType =
	(typeof ProductTypeEnum)[keyof typeof ProductTypeEnum];

/**
 * @note: The stock status should be updated via cron job hourly
 */
export const ProductStockEnum = {
	LOW_STOCK: 'low_stock', // Stock running low
	OUT_OF_STOCK: 'out_of_stock', // Temporarily unavailable
} as const;

export type ProductStock =
	(typeof ProductStockEnum)[keyof typeof ProductStockEnum];

const ENTITY_TABLE_NAME = 'product';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Stores core product information; textual content is saved in a product-content.entity',
})
export default class ProductEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('varchar', { nullable: false })
	@Index('IDX_product_sku', { unique: true })
	sku!: string;

	@Column('int', { nullable: false })
	@Index('IDX_product_brand_id')
	brand_id!: number;

	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: false,
		comment: 'Default price if not specified otherwise',
	})
	price!: number;

	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
		comment: 'Default currency for price if not specified otherwise',
	})
	currency!: string;

	@Column('decimal', {
		precision: 5,
		scale: 2,
		nullable: false,
		default: 0,
		comment: 'Default VAT rate if not specified otherwise',
	})
	vat_rate!: number;

	@Column({
		type: 'enum',
		enum: ProductWorkflowEnum,
		default: ProductWorkflowEnum.DRAFT,
		nullable: false,
	})
	@Index('IDX_product_workflow')
	workflow!: ProductWorkflow;

	@Column({
		type: 'enum',
		enum: ProductSaleStatusEnum,
		default: ProductSaleStatusEnum.ON_SALE,
		nullable: false,
	})
	@Index('IDX_product_sale_status')
	sale_status!: ProductSaleStatus;

	@Column({
		type: 'enum',
		enum: ProductTypeEnum,
		default: ProductTypeEnum.PHYSICAL,
		nullable: false,
	})
	type!: ProductType;

	@Column({
		type: 'enum',
		enum: ProductStockEnum,
		nullable: true,
		comment: 'Stock status; updated via cron job',
	})
	stock_status?: ProductStock | null;

	@Column('int', {
		nullable: false,
		default: 0,
		comment:
			'Available stock quantity - this is just a snapshot not the real value',
	})
	stock_qty!: number;

	@Column({ type: 'timestamp', nullable: false })
	stock_updated_at!: Date;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	// RELATIONS
	@ManyToOne('BrandEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'brand_id' })
	brand?: BrandEntity;

	@OneToMany('ProductTagEntity', (tag: ProductTagEntity) => tag.product)
	tags?: ProductTagEntity[];

	@OneToMany(
		'ProductCategoryEntity',
		(productCategory: ProductCategoryEntity) => productCategory.product,
	)
	categories?: ProductCategoryEntity[];

	@OneToMany(
		'ProductAttributeEntity',
		(attribute: ProductAttributeEntity) => attribute.product,
	)
	attributes?: ProductAttributeEntity[];
}
