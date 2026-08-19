import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The `complaint` table only. `review` is still an unmigrated entity, so a generated migration
 * carries it too — this one was cut down to what the complaint feature needs to run, along with the
 * `document_series` column drops and the foreign-key renames the same generation swept up from
 * unrelated drift.
 *
 * The `FK_1ab3e0…` name is the one TypeORM derives from the table and column, kept verbatim so the
 * next `migration:generate` sees the schema it expects instead of re-creating the constraint.
 */
export class Complaint1787700000000 implements MigrationInterface {
	name = 'Complaint1787700000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."complaint_entity_type_enum" AS ENUM('article', 'comment')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."complaint_reason_enum" AS ENUM('spam', 'offensive', 'harassment', 'hate_speech', 'misinformation', 'inappropriate', 'copyright', 'other')`,
		);
		await queryRunner.query(
			`CREATE TABLE "complaint" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "entity_type" "public"."complaint_entity_type_enum" NOT NULL, "entity_id" integer NOT NULL, "user_id" integer NOT NULL, "reason" "public"."complaint_reason_enum" NOT NULL, "description" text, "is_resolved" boolean NOT NULL DEFAULT false, "resolved_at" TIMESTAMP, "resolved_by" integer, CONSTRAINT "CHK_complaint_resolved" CHECK (is_resolved = (resolved_at IS NOT NULL)), CONSTRAINT "PK_a9c8dbc2ab4988edcc2ff0a7337" PRIMARY KEY ("id")); COMMENT ON COLUMN "complaint"."resolved_by" IS 'Moderator user ID'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_complaint_user_id" ON "complaint" ("user_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_complaint_open" ON "complaint" ("created_at") WHERE is_resolved = false AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_complaint_user" ON "complaint" ("entity_type", "entity_id", "user_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_complaint_deleted_at" ON "complaint" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "complaint" ADD CONSTRAINT "FK_1ab3e07eb3ce33129dfb6d6af83" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "complaint" DROP CONSTRAINT "FK_1ab3e07eb3ce33129dfb6d6af83"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_complaint_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."UQ_complaint_user"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_complaint_open"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_complaint_user_id"`);
		await queryRunner.query(`DROP TABLE "complaint"`);
		await queryRunner.query(`DROP TYPE "public"."complaint_reason_enum"`);
		await queryRunner.query(
			`DROP TYPE "public"."complaint_entity_type_enum"`,
		);
	}
}
