import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The `comment` feature's two tables only. `review` and `complaint` are still unmigrated entities,
 * so a generated migration carries them too — this one was cut down to what the comment feature
 * needs to run, along with the `document_series` column drops and the foreign-key renames the same
 * generation swept up from unrelated drift.
 *
 * The `FK_8bd8d0…` / `FK_bbfe15…` names are the ones TypeORM derives from the table and column,
 * kept verbatim so the next `migration:generate` sees the schema it expects instead of re-creating
 * the constraints.
 */
export class Comment1787600000000 implements MigrationInterface {
	name = 'Comment1787600000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."comment_entity_type_enum" AS ENUM('article', 'review')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."comment_type_enum" AS ENUM('comment', 'question', 'tip')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."comment_status_enum" AS ENUM('pending', 'rejected', 'spam', 'approved', 'flagged')`,
		);
		await queryRunner.query(
			`CREATE TABLE "comment" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "entity_type" "public"."comment_entity_type_enum" NOT NULL, "entity_id" integer NOT NULL, "type" "public"."comment_type_enum" NOT NULL DEFAULT 'comment', "content" text NOT NULL, "status" "public"."comment_status_enum" NOT NULL DEFAULT 'pending', "parent_id" integer, "user_id" integer, "user_ip_hash" character varying NOT NULL, "guest_name" character varying, "guest_email" character varying, "guest_website" character varying, "reply_count" integer NOT NULL DEFAULT '0', "is_pinned" boolean NOT NULL DEFAULT false, "is_staff" boolean NOT NULL DEFAULT false, "moderated_at" TIMESTAMP, "moderated_by" integer, "moderation_reason" character varying, CONSTRAINT "CHK_comment_author" CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL)), CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id")); COMMENT ON COLUMN "comment"."parent_id" IS 'Parent comment ID'; COMMENT ON COLUMN "comment"."user_ip_hash" IS 'Recorded IP address (hashed for privacy)'; COMMENT ON COLUMN "comment"."guest_name" IS 'Guest commenter name if not logged in'; COMMENT ON COLUMN "comment"."guest_email" IS 'Guest commenter email'; COMMENT ON COLUMN "comment"."guest_website" IS 'Guest commenter website'; COMMENT ON COLUMN "comment"."is_staff" IS 'Staff/administrator comment'; COMMENT ON COLUMN "comment"."moderated_by" IS 'Moderator user ID'; COMMENT ON COLUMN "comment"."moderation_reason" IS 'Reason for moderation action'`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "comment" IS 'Stores user comments on articles and replies to reviews'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_comment_parent_id" ON "comment" ("parent_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_comment_user_ip_hash" ON "comment" ("user_ip_hash", "created_at")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_comment_user_status" ON "comment" ("user_id", "status", "created_at")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_comment_moderation" ON "comment" ("created_at") WHERE status = 'pending'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_comment_entity" ON "comment" ("entity_type", "entity_id", "status", "parent_id", "created_at")`,
		);
		await queryRunner.query(
			`ALTER TABLE "comment" ADD CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209" FOREIGN KEY ("parent_id") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "comment" ADD CONSTRAINT "FK_bbfe153fa60aa06483ed35ff4a7" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);

		await queryRunner.query(
			`CREATE TYPE "public"."comment_subscription_entity_type_enum" AS ENUM('article', 'review')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."comment_subscription_notification_type_enum" AS ENUM('all', 'replies_to_me', 'unsubscribed')`,
		);
		await queryRunner.query(
			`CREATE TABLE "comment_subscription" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, "user_name" character varying NOT NULL, "user_email" character varying NOT NULL, "entity_type" "public"."comment_subscription_entity_type_enum" NOT NULL, "entity_id" integer NOT NULL, "notification_type" "public"."comment_subscription_notification_type_enum" NOT NULL DEFAULT 'all', "unsubscribe_token" character varying(64) NOT NULL, CONSTRAINT "PK_9c8ae068d33a3853fc4b5e49a9f" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_comment_subscription_token" ON "comment_subscription" ("unsubscribe_token")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_comment_subscription_user" ON "comment_subscription" ("entity_type", "entity_id", "user_email")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."UQ_comment_subscription_user"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."UQ_comment_subscription_token"`,
		);
		await queryRunner.query(`DROP TABLE "comment_subscription"`);
		await queryRunner.query(
			`DROP TYPE "public"."comment_subscription_notification_type_enum"`,
		);
		await queryRunner.query(
			`DROP TYPE "public"."comment_subscription_entity_type_enum"`,
		);

		await queryRunner.query(
			`ALTER TABLE "comment" DROP CONSTRAINT "FK_bbfe153fa60aa06483ed35ff4a7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "comment" DROP CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_comment_entity"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_comment_moderation"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_comment_user_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_comment_user_ip_hash"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_comment_parent_id"`);
		await queryRunner.query(`DROP TABLE "comment"`);
		await queryRunner.query(`DROP TYPE "public"."comment_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."comment_type_enum"`);
		await queryRunner.query(
			`DROP TYPE "public"."comment_entity_type_enum"`,
		);
	}
}
