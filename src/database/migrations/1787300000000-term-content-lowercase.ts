import type { MigrationInterface, QueryRunner } from 'typeorm';

export class TermContentLowercase1787300000000 implements MigrationInterface {
	name = 'TermContentLowercase1787300000000';

	/**
	 * Brings the stored wording in line with the rule the validator now enforces on every
	 * write: a term reads the same however it was typed.
	 *
	 * `term_content` is unique on (term_id, language), which lower-casing cannot violate — two
	 * terms whose values collide only after the change stay two rows, and the duplicate rule
	 * that would now reject them lives in the service, not the schema.
	 */
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE "term_content" SET "value" = lower(trim("value")) WHERE "value" <> lower(trim("value"))`,
		);
	}

	/**
	 * Irreversible by nature: the original capitalisation is not recorded anywhere, so there is
	 * nothing to restore it from. Kept as a no-op rather than a throw so rolling back the
	 * migrations either side of this one still works.
	 */
	public async down(): Promise<void> {
		// no-op — see above
	}
}
