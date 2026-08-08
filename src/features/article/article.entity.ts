import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
} from 'typeorm';
import type ArticleCategoryEntity from '@/features/article/article-category.entity';
import type ArticleTagEntity from '@/features/article/article-tag.entity';
import type ArticleVisibilityRuleEntity from '@/features/article/article-visibility-rule.entity';
import type UserEntity from '@/features/user/user.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';
import type { StatusTransitions } from '@/shared/types/common.type';

export const ArticleStatusEnum = {
	DRAFT: 'draft',
	PENDING: 'pending', // Article pending review
	REJECTED: 'rejected', // Article rejected by review
	SCHEDULED: 'scheduled', // Article having `publish_at` set as a future date
	PUBLISHED: 'published', // Article displayed
	ARCHIVED: 'archived', // Not available for display
} as const;

export type ArticleStatus =
	(typeof ArticleStatusEnum)[keyof typeof ArticleStatusEnum];

// Allowed status transition configuration
export const STATUS_TRANSITIONS: StatusTransitions<ArticleStatus> = {
	[ArticleStatusEnum.DRAFT]: [ArticleStatusEnum.PENDING],
	[ArticleStatusEnum.PENDING]: [
		ArticleStatusEnum.REJECTED,
		ArticleStatusEnum.SCHEDULED,
		ArticleStatusEnum.PUBLISHED,
	],
	[ArticleStatusEnum.REJECTED]: [ArticleStatusEnum.DRAFT],
	[ArticleStatusEnum.SCHEDULED]: [
		ArticleStatusEnum.DRAFT,
		ArticleStatusEnum.PUBLISHED,
	],
	[ArticleStatusEnum.PUBLISHED]: [ArticleStatusEnum.ARCHIVED],
	[ArticleStatusEnum.ARCHIVED]: [
		// Allow nothing
	],
};

export const ArticleLayoutEnum = {
	DEFAULT: 'default',
} as const;

export type ArticleLayout =
	(typeof ArticleLayoutEnum)[keyof typeof ArticleLayoutEnum];

export const ArticleFeaturedStatusEnum = {
	SECTION: 'section',
	CATEGORY: 'category',
} as const;

export type ArticleFeaturedStatus =
	(typeof ArticleFeaturedStatusEnum)[keyof typeof ArticleFeaturedStatusEnum];

export const ArticleVisibilityEnum = {
	PUBLIC: 'public', // No restrictions - everyone can view
	RESTRICTED: 'restricted', // Configuration options available via separate entity (article_visibility_rules)
} as const;

export type ArticleVisibility =
	(typeof ArticleVisibilityEnum)[keyof typeof ArticleVisibilityEnum];

export const ArticleSourceModeEnum = {
	INPUT: 'input', // Written in-house
	PARSED: 'parsed', // Imported from an external source
} as const;

export type ArticleSourceMode =
	(typeof ArticleSourceModeEnum)[keyof typeof ArticleSourceModeEnum];

export type ArticleSource = {
	label?: string; // Display name of the source
	url?: string; // Link back to the original
	disclaimer?: string; // Legal / editorial notice
	about?: string; // Short description of the source
};

const ENTITY_TABLE_NAME = 'article';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Stores core article information; textual content is saved in article-content.entity',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
// The public listing is "published, already released, newest first", and the scheduler asks the
// same shape ("scheduled with publish_at due"). Leftmost on status, so a status-only filter is
// covered too
@Index('IDX_article_status_publish_at', ['status', 'publish_at'])
// Featured slots are a small subset, and they are always read as an ordered group
@Index('IDX_article_featured', ['featured_status', 'featured_order'], {
	where: 'featured_status IS NOT NULL AND deleted_at IS NULL',
})
// Both scheduled transitions are cron scans over a handful of due rows; the partial predicate keeps
// the index to the rows that actually carry a deadline
@Index('IDX_article_archive_at', ['archive_at'], {
	where: 'archive_at IS NOT NULL AND deleted_at IS NULL',
})
@Index('IDX_article_public_at', ['public_at'], {
	where: 'public_at IS NOT NULL AND deleted_at IS NULL',
})
export default class ArticleEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column({
		type: 'enum',
		enum: ArticleStatusEnum,
		default: ArticleStatusEnum.DRAFT,
		nullable: false,
	})
	status!: ArticleStatus;

	@Column({
		type: 'enum',
		enum: ArticleLayoutEnum,
		default: ArticleLayoutEnum.DEFAULT,
		nullable: false,
	})
	layout!: ArticleLayout;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean> | null;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment: 'Controls when the article should be displayed',
	})
	publish_at?: Date | null;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment: 'Controls when the article should transition to archived',
	})
	archive_at?: Date | null;

	@Column({
		type: 'enum',
		enum: ArticleFeaturedStatusEnum,
		nullable: true,
	})
	featured_status!: ArticleFeaturedStatus | null;

	@Column('int', {
		nullable: false,
		default: 0,
		comment:
			'Order/position of the article within the featured group; Relevant only when featured_status is set',
	})
	featured_order!: number;

	@Column({
		type: 'enum',
		enum: ArticleVisibilityEnum,
		default: ArticleVisibilityEnum.PUBLIC,
		nullable: false,
	})
	visibility!: ArticleVisibility;

	@Column({
		type: 'timestamp',
		nullable: true,
		comment:
			'Controls when the article with restricted visibility should transition to public',
	})
	public_at?: Date | null;

	// Provenance, not presentation — it decides whether the parser owns the record, so it stays a
	// real column the queries can filter on and is never accepted from an update payload
	@Column({
		type: 'enum',
		enum: ArticleSourceModeEnum,
		default: ArticleSourceModeEnum.INPUT,
		nullable: false,
	})
	source_mode!: ArticleSourceMode;

	@Column('jsonb', {
		nullable: true,
		comment:
			'Source attribution for display (label, url, disclaimer, about)',
	})
	source!: ArticleSource | null;

	// RELATIONS
	@Column('int', { nullable: true })
	@Index('IDX_article_author_id')
	author_id!: number | null;

	// The author is attribution, not ownership — deleting the user must leave the article standing
	@ManyToOne('UserEntity', {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn({ name: 'author_id' })
	author?: UserEntity | null;

	// Only present while `visibility` is `restricted`
	@OneToOne(
		'ArticleVisibilityRuleEntity',
		(rule: ArticleVisibilityRuleEntity) => rule.article,
	)
	visibility_rule?: ArticleVisibilityRuleEntity | null;

	@OneToMany('ArticleTagEntity', (tag: ArticleTagEntity) => tag.article)
	tags!: ArticleTagEntity[];

	@OneToMany(
		'ArticleCategoryEntity',
		(category: ArticleCategoryEntity) => category.article,
	)
	categories?: ArticleCategoryEntity[];
}
