import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * GIN indexes backing `PlaceQuery.filterByTerm` and `ArticleQuery.filterByTerm`.
 *
 * Written by hand because TypeORM's `@Index` decorator only describes column lists, and a
 * full-text index has to be built over an *expression*. The consequence is that
 * `migration:generate` cannot see these: they must not be added to the entities, or every
 * future generated migration would try to drop them.
 *
 * The expression is duplicated from the two repositories on purpose — Postgres only uses an
 * expression index when the query repeats it verbatim, down to the `COALESCE` and the
 * `'simple'` configuration. Change one side and the search silently reverts to a sequential
 * scan; there is no error to notice.
 *
 * `'simple'` rather than `'english'`: no stemming and no stop-word list, so place names and
 * titles match as written. A stemmed configuration would fold "Reading" into "read".
 */
export class SearchIndexes1786415990000 implements MigrationInterface {
	name = 'SearchIndexes1786415990000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE INDEX "IDX_place_content_name_search" ON "place_content" USING GIN (to_tsvector('simple', COALESCE("name", '')))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_search" ON "article_content" USING GIN (to_tsvector('simple', COALESCE("title", '') || ' ' || COALESCE("brief", '')))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_search"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_name_search"`,
		);
	}
}
