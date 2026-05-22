import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import type ArticleEntity from './article.entity';
import {SoftDeleteIndex} from "@/shared/decorators/soft-delete-index.decorator";

export type ArticleAuthorType = {
	name: string;
	email?: string;
	avatar?: string;
	description?: string;
};

const ENTITY_TABLE_NAME = 'article_content';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Language-specific content for articles (title, slug, brief, content, meta)',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME)
@Index('IDX_article_content_unique_per_lang', ['article_id', 'language'])
@Index('IDX_article_content_slug_lang', ['slug', 'language'], { unique: true })
export default class ArticleContentEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int', { nullable: false })
	article_id!: number;

	@Column('varchar', {
		length: 3,
		default: 'en',
	})
	language!: string;

	@Column('varchar', { nullable: false })
	slug!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Author details',
	})
	author!: ArticleAuthorType | null;

	@Column('text', { nullable: false })
	title!: string;

	@Column('text', { nullable: true })
	brief!: string | null;

	@Column('text', { nullable: false })
	content!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	content_blocks!: Record<string, string>;

	@Column('jsonb', {
		nullable: true,
		comment: 'SEO metadata for article pages.',
	})
	meta!: Record<string, number> | null;

	// RELATIONS
	@ManyToOne('ArticleEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'article_id' })
	article!: ArticleEntity;
}
