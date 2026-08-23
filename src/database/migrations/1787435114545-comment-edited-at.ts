import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * When a comment's text was last rewritten — by its author from the public endpoint, or by a
 * moderator from the dashboard. Null for a comment nobody has touched since posting.
 *
 * Separate from `updated_at`, which moves for every save on the row (a status decision, a pin) and
 * would put an "edited" marker on comments whose text never changed.
 */
export class CommentEditedAt1787435114545 implements MigrationInterface {
	name = 'CommentEditedAt1787435114545';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "comment" ADD "edited_at" TIMESTAMP`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "comment" DROP COLUMN "edited_at"`,
		);
	}
}
