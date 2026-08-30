import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * When a comment's text was last rewritten — by its author from the public endpoint, or by a
 * moderator from the dashboard. Null for a comment nobody has touched since posting.
 *
 * Separate from `updated_at`, which moves for every save on the row (a status decision, a pin) and
 * would put an "edited" marker on comments whose text never changed.
 *
 * Numbered to land after `1787600000000-comment.ts`, which creates the table. Its original
 * generated timestamp sorted *before* that hand-numbered migration, so the chain only ever
 * worked on a database where `comment` already existed — a build from zero failed here with
 * `relation "comment" does not exist`.
 *
 * `IF NOT EXISTS` covers the databases that ran this under its old name: the renumber makes it
 * pending again for them, and the column is already there.
 */
export class CommentEditedAt1787650000000 implements MigrationInterface {
	name = 'CommentEditedAt1787650000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "comment" ADD COLUMN IF NOT EXISTS "edited_at" TIMESTAMP`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "comment" DROP COLUMN IF EXISTS "edited_at"`,
		);
	}
}
