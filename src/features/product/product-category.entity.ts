import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type CategoryEntity from '@/features/category/category.entity';
import type ProductEntity from '@/features/product/product.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

const ENTITY_TABLE_NAME = 'product_category';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Links products to categories (multilingual via term)',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_product_category_unique', ['product_id', 'category_id'], {
	unique: true,
})
export default class ProductCategoryEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	product_id!: number;

	@Column('int', { nullable: false })
	@Index('IDX_product_category_category_id')
	category_id!: number;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	@ManyToOne('CategoryEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'category_id' })
	category!: CategoryEntity;
}
