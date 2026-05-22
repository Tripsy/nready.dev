import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import type ArticleCategoryEntity from '@/features/article/article-category.entity';
import type ArticleTagEntity from '@/features/article/article-tag.entity';
import type ArticleTrackEntity from '@/features/article/article-track.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

export const ArticleStatusEnum = {
	DRAFT: 'draft', // Initial creation
	PUBLISHED: 'published', // Available for display (note: in combination with show_start_at & show_end_at)
	ARCHIVED: 'archived', // Not available for display
} as const;

export type ArticleStatus =
	(typeof ArticleStatusEnum)[keyof typeof ArticleStatusEnum];

export const ArticleLayoutEnum = {
	DEFAULT: 'default',
} as const;

export type ArticleLayout =
	(typeof ArticleLayoutEnum)[keyof typeof ArticleLayoutEnum];

export const ArticleFeaturedStatusEnum = {
	NOWHERE: 'nowhere',
	HOME: 'home',
	CATEGORY: 'category',
} as const;

export type ArticleFeaturedStatus =
	(typeof ArticleFeaturedStatusEnum)[keyof typeof ArticleFeaturedStatusEnum];

const ENTITY_TABLE_NAME = 'article';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Stores core article information; textual content is saved in article-content.entity',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
export default class ArticleEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column({
		type: 'enum',
		enum: ArticleStatusEnum,
		default: ArticleStatusEnum.DRAFT,
		nullable: false,
	})
	@Index('IDX_article_status')
	status!: ArticleStatus;

	@Column('text', {
		nullable: false,
	})
	layout!: ArticleLayout;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	@Column({ type: 'timestamp', nullable: true })
	publish_at?: Date | null;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment: 'Controls when the article should be displayed',
	})
	show_start_at?: Date | null;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment: 'Controls when the article should be displayed',
	})
	show_end_at?: Date | null;

	@Column({
		type: 'enum',
		enum: ArticleFeaturedStatusEnum,
		default: ArticleFeaturedStatusEnum.NOWHERE,
		nullable: false,
	})
	featuredStatus!: ArticleFeaturedStatus;

	// RELATIONS
	@OneToMany('ArticleTagEntity', (tag: ArticleTagEntity) => tag.article)
	tags!: ArticleTagEntity[];

	@OneToMany(
		'ArticleCategoryEntity',
		(category: ArticleCategoryEntity) => category.article,
	)
	categories?: ArticleCategoryEntity[];

	@OneToOne(
		'ArticleTrackEntity',
		(track: ArticleTrackEntity) => track.article,
	)
	track?: ArticleTrackEntity;
}
