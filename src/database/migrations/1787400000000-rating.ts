import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The `rating` table only. `comment`, `review` and `complaint` arrived in the same change and are
 * still unmigrated, so a generated migration carries all four — this one was cut down to the rows
 * the rating feature needs to run.
 *
 * The `FK_17618c…` name is the one TypeORM derives from the table and column, kept verbatim so the
 * next `migration:generate` sees the schema it expects instead of re-creating the constraint.
 */
export class Rating1787400000000 implements MigrationInterface {
	name = 'Rating1787400000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."rating_entity_type_enum" AS ENUM('article', 'comment')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."rating_type_enum" AS ENUM('like', 'stars', 'emoji')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."rating_reaction_enum" AS ENUM('like', 'dislike', 'love', 'insightful', 'funny')`,
		);
		await queryRunner.query(
			`CREATE TABLE "rating" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "entity_type" "public"."rating_entity_type_enum" NOT NULL, "type" "public"."rating_type_enum" NOT NULL, "entity_id" integer NOT NULL, "user_id" integer, "user_ip_hash" character varying NOT NULL, "value" integer, "reaction" "public"."rating_reaction_enum", CONSTRAINT "CHK_rating_stars_range" CHECK (type <> 'stars' OR value BETWEEN 1 AND 5), CONSTRAINT "CHK_rating_like_range" CHECK (type <> 'like' OR value IN (-1, 1)), CONSTRAINT "CHK_rating_value" CHECK ((type = 'emoji') = (value IS NULL)), CONSTRAINT "CHK_rating_reaction" CHECK ((type = 'emoji') = (reaction IS NOT NULL)), CONSTRAINT "PK_ecda8ad32645327e4765b43649e" PRIMARY KEY ("id")); COMMENT ON COLUMN "rating"."user_ip_hash" IS 'Recorded IP address (hashed for privacy)'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_rating_entity" ON "rating"  ("entity_type", "entity_id", "type") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_rating_user" ON "rating"  ("entity_type", "entity_id", "type", "user_id") WHERE user_id IS NOT NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_rating_ip" ON "rating"  ("entity_type", "entity_id", "type", "user_ip_hash") `,
		);
		await queryRunner.query(
			`ALTER TABLE "rating" ADD CONSTRAINT "FK_17618c8d69b7e2e287bf9f8fbb3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "rating" DROP CONSTRAINT "FK_17618c8d69b7e2e287bf9f8fbb3"`,
		);
		await queryRunner.query(`DROP INDEX "public"."UQ_rating_ip"`);
		await queryRunner.query(`DROP INDEX "public"."UQ_rating_user"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_rating_entity"`);
		await queryRunner.query(`DROP TABLE "rating"`);
		await queryRunner.query(`DROP TYPE "public"."rating_reaction_enum"`);
		await queryRunner.query(`DROP TYPE "public"."rating_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."rating_entity_type_enum"`);
	}
}
