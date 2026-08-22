import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Splits the wording out of `term` into a per-language `term_content`, leaving `term` as the
 * language-neutral identity its consumers already point at.
 *
 * A term row used to *be* one language — unique on `(type, language, value)` — so
 * `product_attribute`, `product_tag` and `product_variant_attribute`, which hold a single
 * `term.id`, pinned themselves to whichever language was picked at write time. A product
 * attributed with "Color" rendered as "Color" in a Romanian storefront, with no way back to
 * "Culoare". The foreign keys are unchanged by this migration; the id they carry simply stops
 * meaning a language.
 *
 * Every existing row becomes its own term with one content row, which is lossless but does not
 * pair anything up: nothing in the old shape recorded that "Color" and "Culoare" were the same
 * term, and no migration can recover it. Re-running the term seed on an empty `term` table is
 * what produces the paired vocabulary.
 */
export class TermContent1786900000000 implements MigrationInterface {
	name = 'TermContent1786900000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		/*
		 * No `deleted_at`, matching `image_content`: a translation is never deleted on its own
		 * — the only write is an upsert — and the row dies with its term through the cascade
		 * below. The soft-delete state stays on `term`, where the delete/restore actions act.
		 */
		await queryRunner.query(
			`CREATE TABLE "term_content" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "term_id" integer NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "value" character varying(255) NOT NULL, CONSTRAINT "PK_term_content" PRIMARY KEY ("id")); COMMENT ON COLUMN "term_content"."value" IS 'Localized term value'`,
		);

		/*
		 * Carries the timestamps across rather than defaulting them to now: these rows are the
		 * same facts under a new shape. `term_id` is the old row's own id, so a soft-deleted
		 * term keeps its wording and still reads correctly under "show deleted".
		 */
		await queryRunner.query(
			`INSERT INTO "term_content" ("term_id", "language", "value", "created_at", "updated_at")
			 SELECT "id", "language", "value", "created_at", "updated_at"
			 FROM "term"`,
		);

		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_term_content_unique_per_lang" ON "term_content"  ("term_id", "language")`,
		);
		await queryRunner.query(
			`ALTER TABLE "term_content" ADD CONSTRAINT "FK_term_content_term" FOREIGN KEY ("term_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "term_content" IS 'Language-specific wording for terms'`,
		);

		await queryRunner.query(`DROP INDEX "public"."IDX_term_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_language"`);

		await queryRunner.query(
			`ALTER TABLE "term" DROP COLUMN "language", DROP COLUMN "value", DROP COLUMN "details"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "term" ADD "language" character varying(3) NOT NULL DEFAULT 'en', ADD "value" character varying(255), ADD "details" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "term"."language" IS 'ISO language code (en will the fallback for universal terms)'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "term"."value" IS 'Localized or universal term value'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "term"."details" IS 'Reserved column for future use'`,
		);

		/*
		 * A term with several translations can only collapse back into one row, so the rollback
		 * keeps the lowest content id per term and drops the rest — the old shape has nowhere to
		 * put them.
		 */
		await queryRunner.query(
			`UPDATE "term" t
			 SET "language" = c."language", "value" = c."value"
			 FROM (
				SELECT DISTINCT ON ("term_id") "term_id", "language", "value"
				FROM "term_content"
				ORDER BY "term_id", "id"
			 ) c
			 WHERE c."term_id" = t."id"`,
		);

		// Terms that never got a content row cannot satisfy the NOT NULL restored below
		await queryRunner.query(`DELETE FROM "term" WHERE "value" IS NULL`);

		await queryRunner.query(
			`ALTER TABLE "term" ALTER COLUMN "value" SET NOT NULL`,
		);

		await queryRunner.query(
			`CREATE INDEX "IDX_term_language" ON "term"  ("language") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_term_unique" ON "term"  ("type", "language", "value") WHERE deleted_at IS NULL`,
		);

		await queryRunner.query(`DROP TABLE "term_content"`);
	}
}
