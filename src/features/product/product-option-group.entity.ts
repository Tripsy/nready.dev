import {
	Check,
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import type ProductEntity from '@/features/product/product.entity';
import type ProductOptionEntity from '@/features/product/product-option.entity';
import type TermEntity from '@/features/term/term.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'product_option_group';

/**
 * A question asked at order time — "choose a side", "extras" — whose answers are the rows in
 * `product_option`.
 *
 * Distinct from a variant: a variant is a different thing to sell, with its own SKU and price
 * row, while an option modifies the thing being sold by a delta. Large vs small pizza is a
 * variant; extra bacon is an option.
 *
 * How many answers are accepted is expressed only as `min_select` / `max_select`. There is no
 * `is_required` flag and no single/multiple enum on purpose: both would have to agree with the
 * bounds, and the pair that drifts is the one nobody notices. Required means `min_select >= 1`,
 * single-choice means `max_select = 1`.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'A choice offered on a product at order time; the answers live in product-option.entity',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_product_option_group_product_id', ['product_id', 'position'])
@Index('IDX_product_option_group_label_id', ['label_id'])
@Check(`(min_select >= 0)`)
@Check(`(max_select IS NULL OR max_select >= min_select)`)
export default class ProductOptionGroupEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	product_id!: number;

	@Column('int', {
		nullable: false,
		comment: 'Term holding the multilingual prompt, e.g. "Choose a side"',
	})
	label_id!: number;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Answers that must be chosen; 0 makes the group optional',
	})
	min_select!: number;

	@Column('int', {
		nullable: true,
		comment: 'Answers that may be chosen; NULL means no upper bound',
	})
	max_select!: number | null;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Display order within the product',
	})
	position!: number;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	@ManyToOne('TermEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'label_id' })
	label!: TermEntity;

	@OneToMany(
		'ProductOptionEntity',
		(option: ProductOptionEntity) => option.option_group,
	)
	options?: ProductOptionEntity[];
}
