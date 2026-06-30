import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToMany,
	Tree,
	TreeChildren,
	TreeParent,
} from 'typeorm';
import type CategoryContentEntity from '@/features/category/category-content.entity';
import {
	EntityAbstract,
	type PageMeta,
} from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';
import type { StatusTransitions } from '@/shared/types/common.type';

export const CategoryStatusEnum = {
	ACTIVE: 'active',
	PENDING: 'pending',
	INACTIVE: 'inactive',
} as const;

export type CategoryStatus =
	(typeof CategoryStatusEnum)[keyof typeof CategoryStatusEnum];

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<CategoryStatus> = {
	[CategoryStatusEnum.ACTIVE]: [CategoryStatusEnum.INACTIVE],
	[CategoryStatusEnum.INACTIVE]: [CategoryStatusEnum.ACTIVE],
	[CategoryStatusEnum.PENDING]: [
		CategoryStatusEnum.ACTIVE,
		CategoryStatusEnum.INACTIVE,
	],
};

export const CategoryTypeEnum = {
	PRODUCT: 'product',
	ARTICLE: 'article',
} as const;

export type CategoryType =
	(typeof CategoryTypeEnum)[keyof typeof CategoryTypeEnum];

export type CategoryContentInput = {
	language: string;
	label: string;
	slug: string;
	description?: string;
	meta: PageMeta;
};

const ENTITY_TABLE_NAME = 'category';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Hierarchical product categories',
})
@Tree('closure-table')
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_category_type', ['type', 'status'])
export default class CategoryEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column({
		type: 'enum',
		enum: CategoryStatusEnum,
		default: CategoryStatusEnum.PENDING,
		nullable: false,
	})
	status!: CategoryStatus;

	@Column({
		type: 'enum',
		enum: CategoryTypeEnum,
		default: CategoryTypeEnum.PRODUCT,
		nullable: false,
		comment: 'Specifies the entity type this category belongs to',
	})
	type!: CategoryType;

	@Column('int', {
		default: 0,
		comment: 'Sort order among siblings',
	})
	sort_order!: number;

	/**
	 * Hierarchy
	 */
	@TreeParent()
	@JoinColumn({ name: 'parent_id' })
	parent?: CategoryEntity | null;

	@TreeChildren()
	children?: CategoryEntity[];

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details?: Record<string, string | number | boolean>;

	// RELATIONS
	@OneToMany(
		'CategoryContentEntity',
		(content: CategoryContentEntity) => content.category,
	)
	contents?: CategoryContentEntity[];
}
