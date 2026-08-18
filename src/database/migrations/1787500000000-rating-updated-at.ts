import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `rating` stops being insert-only: a reader who changes their mind now edits the row they
 * already hold, so it needs somewhere to record when that happened.
 *
 * `TIMESTAMP DEFAULT now()` is the shape `@UpdateDateColumn` generates and what all 49 tables in
 * the init migration carry; anything else leaves drift that the next `migration:generate` for an
 * unrelated feature would pick up. A freshly cast rating therefore reads `updated_at` equal to
 * `created_at` — "never changed" is `updated_at <= created_at`, not a null. Rows that predate
 * this column keep a null, which the default does not backfill.
 */
export class RatingUpdatedAt1787500000000 implements MigrationInterface {
	name = 'RatingUpdatedAt1787500000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "rating" ADD "updated_at" TIMESTAMP DEFAULT now()`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "rating" DROP COLUMN "updated_at"`,
		);
	}
}
