import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type ProductEntity from '@/features/product/product.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

const ENTITY_TABLE_NAME = 'product_availability';

/**
 * Recurring windows in which the product may be ordered — a lunch menu on weekdays between 12:00
 * and 15:00, a happy hour every evening.
 *
 * Deliberately separate from `product.available_from` / `available_until`, which answer a
 * different question. Those are absolute and describe the product's life in the catalog: when it
 * first appears and when it is withdrawn, and they alone drive `sale_status`. These rows describe
 * the hours *within* that life when ordering is open, repeat forever, and leave `sale_status`
 * untouched — an out-of-hours product is still `available`, just not right now.
 *
 * **No row means always available.** The absence of a restriction is the common case and should
 * not require one row per weekday to express.
 */
@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Recurring ordering windows for a product; no row at all means unrestricted',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
// Resolving "can this be ordered now" reads every window for one product and filters by weekday
@Index('IDX_product_availability_product_id', ['product_id', 'day_of_week'])
@Check(`(day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6))`)
@Check(`(ends_at > starts_at)`)
@Check(
	`(valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)`,
)
export default class ProductAvailabilityEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	product_id!: number;

	// ISO-8601 numbering (1 = Monday … 7 = Sunday) would collide with the 0-based `getDay()` the
	// rest of the stack speaks, so this is 0 = Sunday … 6 = Saturday, matching JavaScript
	@Column('smallint', {
		nullable: true,
		comment: 'Day this window applies to, 0 = Sunday; NULL means every day',
	})
	day_of_week!: number | null;

	// `time` rather than `timestamp`: these are clock times that recur, with no date attached.
	// They are read in the venue's timezone, not the customer's
	@Column('time', {
		nullable: false,
		comment: 'Window opens, venue local time',
	})
	starts_at!: string;

	@Column('time', {
		nullable: false,
		comment: 'Window closes, venue local time',
	})
	ends_at!: string;

	// A seasonal menu is a recurring window that itself expires — the summer terrace list runs
	// daily, but only between May and September
	@Column('date', {
		nullable: true,
		comment: 'First date this window applies; NULL means no lower bound',
	})
	valid_from!: string | null;

	@Column('date', {
		nullable: true,
		comment: 'Last date this window applies; NULL means no upper bound',
	})
	valid_until!: string | null;

	// RELATIONS
	@ManyToOne('ProductEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'product_id' })
	product!: ProductEntity;
}
