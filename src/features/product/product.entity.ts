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
import type ProductDiscountEntity from '@/features/product/product-discount.entity';
import type ProductPriceEntity from '@/features/product/product-price.entity';
import type ProductTagEntity from '@/features/product/product-tag.entity';
import type VendorEntity from '@/features/vendor/vendor.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';
import type { StatusTransitions } from '@/shared/types/common.type';

export const ProductWorkflowEnum = {
	DRAFT: 'draft', // Initial creation
	PENDING_REVIEW: 'pending_review', // Awaiting approval
	REVISION_REQUIRED: 'revision_required', // Needs changes
	READY: 'ready', // Ready to be sold
} as const;

export type ProductWorkflow =
	(typeof ProductWorkflowEnum)[keyof typeof ProductWorkflowEnum];

// Allowed status transition configuration
export const WORKFLOW_TRANSITIONS: StatusTransitions<ProductWorkflow> = {
	[ProductWorkflowEnum.DRAFT]: [ProductWorkflowEnum.PENDING_REVIEW],
	[ProductWorkflowEnum.PENDING_REVIEW]: [
		ProductWorkflowEnum.REVISION_REQUIRED,
		ProductWorkflowEnum.READY,
	],
	[ProductWorkflowEnum.REVISION_REQUIRED]: [
		ProductWorkflowEnum.PENDING_REVIEW,
	],
	[ProductWorkflowEnum.READY]: [
		// Allow nothing
	],
};

/**
 * Derived, never set directly from a payload: a cron job recomputes it from `available_from`,
 * `available_until` and `discontinued_at`. That is also why it carries no transition map — the
 * timestamps are the input the user edits, this is only their projection.
 */
export const ProductSaleStatusEnum = {
	AVAILABLE: 'available', // Sellable now
	COMING_SOON: 'coming_soon', // `available_from` is in the future
	UNAVAILABLE: 'unavailable', // `available_until` has passed
	DISCONTINUED: 'discontinued', // `discontinued_at` is set — permanent
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
 * The unit `price` in `product-price` is quoted per, and the unit a quantity is expressed in.
 */
export const ProductUnitEnum = {
	PIECE: 'piece',
	KG: 'kg',
	LITRE: 'litre',
	METRE: 'metre',
	HOUR: 'hour',
} as const;

export type ProductUnit =
	(typeof ProductUnitEnum)[keyof typeof ProductUnitEnum];

/**
 * The VAT *class* a product declares. The *rate* it resolves to is a function of jurisdiction and
 * date, so it is worked out when the order line is written and snapshot there
 * (`order_product.vat_rate`).
 *
 * Stored as a plain `varchar`, not a Postgres enum, even though the list lives here: the set is
 * jurisdiction-specific and grows, and `ALTER TYPE ... ADD VALUE` cannot run inside a transaction
 * block. Adding a class stays a code change instead of becoming a special-cased migration.
 */
export const ProductVatCategoryEnum = {
	STANDARD: 'standard',
	REDUCED: 'reduced',
	SECOND_REDUCED: 'second_reduced',
	ZERO: 'zero',
	EXEMPT: 'exempt',
} as const;

export type ProductVatCategory =
	(typeof ProductVatCategoryEnum)[keyof typeof ProductVatCategoryEnum];

const ENTITY_TABLE_NAME = 'product';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Stores core product information; textual content is saved in a product-content.entity, prices in a product-price.entity',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
// Both availability windows are cron scans over a handful of due rows; the partial predicate keeps
// the index to the rows that actually carry a deadline. `discontinued_at` gets none — it is set by
// hand and the service moves `sale_status` in the same write, so nothing ever scans for it
@Index('IDX_product_available_from', ['available_from'], {
	where: 'available_from IS NOT NULL AND deleted_at IS NULL',
})
@Index('IDX_product_available_until', ['available_until'], {
	where: 'available_until IS NOT NULL AND deleted_at IS NULL',
})
export default class ProductEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('varchar', { nullable: false })
	@Index('IDX_product_sku', { unique: true, where: 'deleted_at IS NULL' })
	sku!: string;

	@Column('varchar', {
		nullable: true,
		comment:
			'External identifier (EAN / UPC / GTIN); `sku` is the internal one',
	})
	@Index('IDX_product_barcode', {
		unique: true,
		where: 'barcode IS NOT NULL AND deleted_at IS NULL',
	})
	barcode!: string | null;

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
		default: ProductSaleStatusEnum.AVAILABLE,
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
		enum: ProductUnitEnum,
		default: ProductUnitEnum.PIECE,
		nullable: false,
	})
	unit!: ProductUnit;

	@Column('varchar', {
		length: 32,
		nullable: false,
		default: ProductVatCategoryEnum.STANDARD,
		comment: 'VAT class key; see ProductVatCategoryEnum',
	})
	vat_category!: ProductVatCategory;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment: 'Controls when the product becomes sellable',
	})
	available_from!: Date | null;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment: 'Controls when the product stops being sellable',
	})
	available_until!: Date | null;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment:
			'Set once the product is permanently withdrawn from the catalog',
	})
	discontinued_at!: Date | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	@Column('int', { nullable: false })
	@Index('IDX_product_brand_id')
	brand_id!: number;

	@Column('int', { nullable: true })
	@Index('IDX_product_vendor_id')
	vendor_id!: number | null;

	// RELATIONS
	@ManyToOne('BrandEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'brand_id' })
	brand?: BrandEntity;

	@ManyToOne('VendorEntity', {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn({ name: 'vendor_id' })
	vendor?: VendorEntity | null;

	@OneToMany(
		'ProductPriceEntity',
		(price: ProductPriceEntity) => price.product,
	)
	prices?: ProductPriceEntity[];

	@OneToMany(
		'ProductDiscountEntity',
		(productDiscount: ProductDiscountEntity) => productDiscount.product,
	)
	discounts?: ProductDiscountEntity[];

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
