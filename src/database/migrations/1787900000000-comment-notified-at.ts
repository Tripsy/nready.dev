import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `comment.notified_at` — the marker the four-hourly subscriber digest selects on.
 *
 * Existing rows are backfilled with their own `created_at` rather than left null: the column is
 * new but the comments are not, and a null would put every approved comment ever written into the
 * first digest run.
 *
 * The index is partial and matches that selection exactly (`approved` and not yet announced), so
 * it stays the size of the outstanding queue rather than of the table.
 */
export class CommentNotifiedAt1787900000000 implements MigrationInterface {
	name = 'CommentNotifiedAt1787900000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "comment" ADD "notified_at" TIMESTAMP`,
		);
		await queryRunner.query(
			`UPDATE "comment" SET "notified_at" = "created_at"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_comment_notify_pending" ON "comment" ("notified_at") WHERE status = 'approved' AND notified_at IS NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_comment_notify_pending"`,
		);
		await queryRunner.query(
			`ALTER TABLE "comment" DROP COLUMN "notified_at"`,
		);
	}
}
