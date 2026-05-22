import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductEntity from '@/features/product/product.entity';
import type TermEntity from '@/features/term/term.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

const ENTITY_TABLE_NAME = 'product_attribute';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Key/value attributes for products, using multilingual terms',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index(
	'IDX_product_attribute_unique',
	['product_id', 'attribute_label_id', 'attribute_value_id'],
	{
		unique: true,
	},
)
export default class ProductAttributeEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	@Index('IDX_product_attribute_product_id')
	product_id!: number;

	@Column('int', { nullable: false })
	attribute_label_id!: number;

	@Column('int', { nullable: false })
	attribute_value_id!: number;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	@ManyToOne('TermEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'attribute_label_id' })
	attribute_label!: TermEntity;

	@ManyToOne('TermEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'attribute_value_id' })
	attribute_value!: TermEntity;
}
