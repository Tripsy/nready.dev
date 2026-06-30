import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import type ArticleEntity from './article.entity';

const ENTITY_TABLE_NAME = 'article_content';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Track article views, etc.',
})
@Index('IDX_article_track_article_id_unique', ['article_id'], { unique: true })
export default class ArticleTrackEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = false;

	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@Column('int', { nullable: false })
	article_id!: number;

	@Column('int', { nullable: false, default: 0 })
	views!: number;

	@Column('int', { nullable: true })
	reading_time_minutes?: number | null;

	// RELATIONS
	@OneToOne('ArticleEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'article_id' })
	article!: ArticleEntity;
}
