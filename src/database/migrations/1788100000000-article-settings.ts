import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Documents `article.details` as the home of the per-article `allow_rating` / `allow_comments` /
 * `allow_complaints` switches.
 *
 * Comment only — the column already exists and the switches are jsonb keys, so no stored row
 * changes. An article that overrides nothing keeps `details` null and follows the deployment
 * defaults (`ARTICLE_ALLOW_*`, all on unless set to `false`).
 */
export class ArticleSettings1788100000000 implements MigrationInterface {
	name = 'ArticleSettings1788100000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`COMMENT ON COLUMN "article"."details" IS 'Free-form article data; the \`allow_rating\` / \`allow_comments\` / \`allow_complaints\` keys hold the per-article overrides of the deployment defaults'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`COMMENT ON COLUMN "article"."details" IS 'Reserved column for future use'`,
		);
	}
}
