import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddressRelated1773625744453 implements MigrationInterface {
	name = 'AddressRelated1773625744453';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_62d41b573e8a6d5e4a8edddac60"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_7f4ede2827df34706cfdba7238b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_da8137d639bcd3bb5a1cac23506"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_track_article_id_unique"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_content" IS 'Language-specific content for articles (title, slug, brief, content, meta)'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."client_address_address_type_enum" AS ENUM('billing', 'delivery')`,
		);
		await queryRunner.query(
			`CREATE TABLE "client_address" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "client_id" integer NOT NULL, "address_type" "public"."client_address_address_type_enum" NOT NULL, "address_city_id" integer, "address_info" text NOT NULL, "address_postal_code" character varying, "notes" text, CONSTRAINT "PK_fea7ca529948e3e15c4f91b37fc" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_client_address_client_id" ON "client_address" ("client_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_client_address_address_type" ON "client_address" ("address_type") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "client_address" IS 'Client addresses'`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_info"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_postal_code"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_country"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_region"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_city"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "created_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "updated_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "deleted_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "language"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "slug"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "author"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "title"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "brief"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "content_blocks"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "meta"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "views"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "views" integer NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "updated_at" TIMESTAMP DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "deleted_at" TIMESTAMP`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "language" character varying(3) NOT NULL DEFAULT 'en'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "slug" character varying NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "author" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."author" IS 'Author details'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "title" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "brief" text`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "content" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "content_blocks" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."content_blocks" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "meta" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."meta" IS 'SEO metadata for article pages.'`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_status_created_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_method_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_gateway_status"`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."cash_flow_status_enum" RENAME TO "cash_flow_status_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_status_enum" AS ENUM('pending', 'authorized', 'completed', 'failed', 'canceled', 'expired', 'requires_action')`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "status" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "status" TYPE "public"."cash_flow_status_enum" USING "status"::"text"::"public"."cash_flow_status_enum"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "status" SET DEFAULT 'pending'`,
		);
		await queryRunner.query(
			`DROP TYPE "public"."cash_flow_status_enum_old"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c" UNIQUE ("article_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_status_created_at" ON "cash_flow" ("status", "created_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_method_status" ON "cash_flow" ("method", "status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_gateway_status" ON "cash_flow" ("gateway", "status") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("slug", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`ALTER TABLE "client_address" ADD CONSTRAINT "FK_3d8c00d2213b8fdefc2d18a11de" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client_address" ADD CONSTRAINT "FK_1c190825d4d82eb29d1fa2a9f4c" FOREIGN KEY ("address_city_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client_address" DROP CONSTRAINT "FK_1c190825d4d82eb29d1fa2a9f4c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client_address" DROP CONSTRAINT "FK_3d8c00d2213b8fdefc2d18a11de"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_track_article_id_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_gateway_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_method_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_status_created_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_status_enum_old" AS ENUM('pending', 'authorized', 'completed', 'failed', 'refunded', 'partially_refunded', 'canceled', 'expired', 'requires_action')`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "status" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "status" TYPE "public"."cash_flow_status_enum_old" USING "status"::"text"::"public"."cash_flow_status_enum_old"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "status" SET DEFAULT 'pending'`,
		);
		await queryRunner.query(`DROP TYPE "public"."cash_flow_status_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."cash_flow_status_enum_old" RENAME TO "cash_flow_status_enum"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_gateway_status" ON "cash_flow" ("gateway", "status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_method_status" ON "cash_flow" ("method", "status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_status_created_at" ON "cash_flow" ("created_at", "status") `,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."meta" IS 'SEO metadata for article pages.'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "meta"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."content_blocks" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "content_blocks"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "brief"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "title"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."author" IS 'Author details'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "author"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "slug"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "language"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "deleted_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "updated_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "created_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "views"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "views" integer NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "meta" jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "content_blocks" jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "content" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "brief" text`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "title" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "author" jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "slug" character varying NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "language" character varying(3) NOT NULL DEFAULT 'en'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "deleted_at" TIMESTAMP`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "updated_at" TIMESTAMP DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_city" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_region" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_country" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_postal_code" character varying`,
		);
		await queryRunner.query(`ALTER TABLE "client" ADD "address_info" text`);
		await queryRunner.query(`COMMENT ON TABLE "client_address" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_client_address_address_type"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_client_address_client_id"`,
		);
		await queryRunner.query(`DROP TABLE "client_address"`);
		await queryRunner.query(
			`DROP TYPE "public"."client_address_address_type_enum"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_content" IS 'Track article views, etc.'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("language", "slug") `,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_da8137d639bcd3bb5a1cac23506" FOREIGN KEY ("address_region") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_7f4ede2827df34706cfdba7238b" FOREIGN KEY ("address_country") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_62d41b573e8a6d5e4a8edddac60" FOREIGN KEY ("address_city") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
	}
}
