import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ArticleFeaturedExpireAt1787200000000
	implements MigrationInterface
{
	name = 'ArticleFeaturedExpireAt1787200000000';

	/**
	 * The deadline a featured placement runs to. Nullable and unindexed: the only reader is the
	 * daily `expire-featured-article` cron, which scans the handful of rows carrying a
	 * `featured_status` at all.
	 */
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article" ADD "featured_expire_at" TIMESTAMP`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article"."featured_expire_at" IS 'Controls when featured_status should be cleared; Relevant only when featured_status is set'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article" DROP COLUMN "featured_expire_at"`,
		);
	}
}
