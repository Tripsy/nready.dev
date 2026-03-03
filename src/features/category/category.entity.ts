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
import type { StatusTransitions } from '@/shared/types/common.type';

export enum CategoryStatusEnum {
	ACTIVE = 'active',
	PENDING = 'pending',
	INACTIVE = 'inactive',
}

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<CategoryStatusEnum> = {
	[CategoryStatusEnum.ACTIVE]: [CategoryStatusEnum.INACTIVE],
	[CategoryStatusEnum.INACTIVE]: [CategoryStatusEnum.ACTIVE],
	[CategoryStatusEnum.PENDING]: [
		CategoryStatusEnum.ACTIVE,
		CategoryStatusEnum.INACTIVE,
	],
};

export enum CategoryTypeEnum {
	PRODUCT = 'product',
	ARTICLE = 'article',
}

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
	status!: CategoryStatusEnum;

	@Column({
		type: 'enum',
		enum: CategoryTypeEnum,
		default: CategoryTypeEnum.PRODUCT,
		nullable: false,
		comment: 'Specifies the entity type this category belongs to',
	})
	type!: CategoryTypeEnum;

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
