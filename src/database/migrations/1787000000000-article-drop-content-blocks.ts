import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ArticleDropContentBlocks1787000000000
	implements MigrationInterface
{
	name = 'ArticleDropContentBlocks1787000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "content_blocks"`,
		);
	}

	/**
	 * The column comes back empty. It only ever held the reserved-for-future-use placeholder —
	 * nothing wrote to it — so there is no data to restore and the down path is the shape alone.
	 */
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "content_blocks" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."content_blocks" IS 'Reserved column for future use'`,
		);
	}
}
