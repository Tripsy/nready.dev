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
import type ProductBundleItemEntity from '@/features/product/product-bundle-item.entity';
import type TermEntity from '@/features/term/term.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'product_bundle_group';

/**
 * A choice offered inside a bundle — "choose a side", "choose a drink" — whose candidates are the
 * `product_bundle_item` rows pointing at it.
 *
 * Same shape as `product_option_group`, down to the `min_select` / `max_select` pair and the
 * absence of an `is_required` flag. The difference is what the answers are: an option's answer is a
 * `term`, a label with a price delta and nothing behind it, while a bundle item's answer is a
 * `product_variant` — a real sellable thing with its own stock, VAT class and cost. That is why the
 * two are separate tables rather than one with a nullable column: the behaviour at checkout
 * diverges completely.
 *
 * A bundle component that is always included needs no group at all; see
 * `product-bundle-item.entity.ts`.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'A choice offered within a bundle; the candidates live in product-bundle-item.entity',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_product_bundle_group_product_id', ['product_id', 'position'])
@Index('IDX_product_bundle_group_label_id', ['label_id'])
@Check(`(min_select >= 0)`)
@Check(`(max_select IS NULL OR max_select >= min_select)`)
export default class ProductBundleGroupEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	product_id!: number;

	@Column('int', {
		nullable: false,
		comment: 'Term holding the multilingual prompt, e.g. "Choose a drink"',
	})
	label_id!: number;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Candidates that must be chosen; 0 makes the group optional',
	})
	min_select!: number;

	@Column('int', {
		nullable: true,
		comment: 'Candidates that may be chosen; NULL means no upper bound',
	})
	max_select!: number | null;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Display order within the bundle',
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
		'ProductBundleItemEntity',
		(item: ProductBundleItemEntity) => item.group,
	)
	items?: ProductBundleItemEntity[];
}
