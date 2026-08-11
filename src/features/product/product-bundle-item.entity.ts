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
import type ProductBundleGroupEntity from '@/features/product/product-bundle-group.entity';
import type ProductBundleItemPriceEntity from '@/features/product/product-bundle-item-price.entity';
import type ProductVariantEntity from '@/features/product/product-variant.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'product_bundle_item';

/**
 * A component of a bundle. `group_id` decides which kind:
 *
 * - **`NULL`** — always included, never presented as a question. The cheeseburger that is simply
 *   part of the burger menu. Modelling it as a group of one would force a term label for a prompt
 *   nobody is ever shown.
 * - **set** — one candidate within that group's choice.
 *
 * `product_id` names the bundle in both cases, so a component is reachable without a group. When
 * `group_id` is set, the two must agree — `group.product_id = item.product_id` — which no
 * constraint here enforces; it is a service-layer check, listed with the others in
 * `.claude/rules/product.md`.
 *
 * `variant_id` points at what is actually consumed, so stock, VAT class and cost all come from the
 * component rather than the bundle.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'A component of a bundle; NULL group_id means always included, otherwise a candidate within that group',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
// Rendering a bundle reads every component it has, grouped or not, in display order
@Index('IDX_product_bundle_item_product_id', ['product_id', 'position'])
@Index('IDX_product_bundle_item_group_id', ['group_id', 'position'])
// Needed for the RESTRICT check a variant delete runs against this table
@Index('IDX_product_bundle_item_variant_id', ['variant_id'])
// At most one preselected candidate per group. Always-included components are excluded: with no
// group to be default *of*, they would all collide on a single NULL key
@Index('IDX_product_bundle_item_default', ['group_id'], {
	unique: true,
	where: 'is_default = true AND group_id IS NOT NULL AND deleted_at IS NULL',
})
@Check(`(quantity > 0)`)
export default class ProductBundleItemEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', {
		nullable: false,
		comment: 'The bundle this component belongs to',
	})
	product_id!: number;

	@Column('int', {
		nullable: true,
		comment: 'NULL means the component is always included, not a choice',
	})
	group_id!: number | null;

	@Column('int', {
		nullable: false,
		comment:
			'The variant consumed when this component is part of the order',
	})
	variant_id!: number;

	@Column('numeric', {
		precision: 12,
		scale: 2,
		nullable: false,
		default: 1,
		comment: 'How many of the variant this component contributes',
	})
	quantity!: number;

	@Column('boolean', {
		nullable: false,
		default: false,
		comment: 'Preselected within its group; meaningless without one',
	})
	is_default!: boolean;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Display order within the group, or within the bundle',
	})
	position!: number;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;

	@ManyToOne('ProductBundleGroupEntity', {
		onDelete: 'CASCADE',
		nullable: true,
	})
	@JoinColumn({ name: 'group_id' })
	group?: ProductBundleGroupEntity | null;

	// RESTRICT: a bundle whose component vanished is silently incomplete, and nothing would report
	// it — better to block the delete and force the bundle to be edited first
	@ManyToOne('ProductVariantEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'variant_id' })
	variant!: ProductVariantEntity;

	@OneToMany(
		'ProductBundleItemPriceEntity',
		(price: ProductBundleItemPriceEntity) => price.item,
	)
	prices?: ProductBundleItemPriceEntity[];
}
