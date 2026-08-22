import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `comment_subscription.language` — what a notification is written in, and what the page its
 * unsubscribe link leads to is rendered in.
 *
 * Backfilled with `en` before the `NOT NULL` is applied. The column has no database default on
 * purpose: the app default belongs to configuration, not to the schema, and a default here would
 * silently absorb a subscriber whose language nobody captured.
 */
export class CommentSubscriptionLanguage1788000000000
	implements MigrationInterface
{
	name = 'CommentSubscriptionLanguage1788000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "comment_subscription" ADD "language" character varying(3)`,
		);
		await queryRunner.query(
			`UPDATE "comment_subscription" SET "language" = 'en' WHERE "language" IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "comment_subscription" ALTER COLUMN "language" SET NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "comment_subscription" DROP COLUMN "language"`,
		);
	}
}
