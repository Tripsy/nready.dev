import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reworks `complaint_reason_enum`: `ai_slop` joins it, `inappropriate` and `other` leave.
 *
 * Postgres cannot drop a value from an enum in place, so the type is rebuilt and the column
 * converted onto it. The rows still carrying a departing value are remapped inside the `USING`
 * clause rather than by a preceding `UPDATE`, which keeps the conversion a single statement — no
 * window in which the column holds a value its type no longer allows.
 *
 * Both directions are lossy in the same way, and deliberately so: `inappropriate` and `other`
 * collapse into `offensive` going up, and everything that became `offensive` stays there coming
 * back down, since nothing records which of the three it started as. `ai_slop` becomes `other` on
 * the way down, that being the only catch-all the old set offers.
 */
export class ComplaintReasonEnum1787800000000 implements MigrationInterface {
	name = 'ComplaintReasonEnum1787800000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."complaint_reason_enum" RENAME TO "complaint_reason_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."complaint_reason_enum" AS ENUM('spam', 'offensive', 'harassment', 'hate_speech', 'misinformation', 'ai_slop', 'copyright')`,
		);
		await queryRunner.query(
			`ALTER TABLE "complaint" ALTER COLUMN "reason" TYPE "public"."complaint_reason_enum" USING (CASE WHEN "reason"::text IN ('inappropriate', 'other') THEN 'offensive' ELSE "reason"::text END)::"public"."complaint_reason_enum"`,
		);
		await queryRunner.query(
			`DROP TYPE "public"."complaint_reason_enum_old"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."complaint_reason_enum" RENAME TO "complaint_reason_enum_new"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."complaint_reason_enum" AS ENUM('spam', 'offensive', 'harassment', 'hate_speech', 'misinformation', 'inappropriate', 'copyright', 'other')`,
		);
		await queryRunner.query(
			`ALTER TABLE "complaint" ALTER COLUMN "reason" TYPE "public"."complaint_reason_enum" USING (CASE WHEN "reason"::text = 'ai_slop' THEN 'other' ELSE "reason"::text END)::"public"."complaint_reason_enum"`,
		);
		await queryRunner.query(
			`DROP TYPE "public"."complaint_reason_enum_new"`,
		);
	}
}
