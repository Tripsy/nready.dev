import { MigrationInterface, QueryRunner } from "typeorm";

export class CashFlowInit1772219474127 implements MigrationInterface {
    name = 'CashFlowInit1772219474127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_article_track_article_id_unique"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_article_content_slug_lang"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_article_content_unique_per_lang"`);
        await queryRunner.query(`COMMENT ON TABLE "article_content" IS 'Language-specific content for articles (title, slug, brief, content, meta)'`);
        await queryRunner.query(`CREATE TYPE "public"."cash_flow_direction_enum" AS ENUM('in', 'out')`);
        await queryRunner.query(`CREATE TYPE "public"."cash_flow_category_type_enum" AS ENUM('revenue', 'expense', 'correction')`);
        await queryRunner.query(`CREATE TYPE "public"."cash_flow_category_enum" AS ENUM('customer', 'fuel', 'maintenance', 'tolls', 'employee_salary', 'employee_reimbursement', 'vendor', 'insurance', 'taxes', 'correction', 'refund')`);
        await queryRunner.query(`CREATE TYPE "public"."cash_flow_gateway_enum" AS ENUM('direct', 'stripe', 'paypal')`);
        await queryRunner.query(`CREATE TYPE "public"."cash_flow_method_enum" AS ENUM('credit_card', 'debit_card', 'paypal', 'cash', 'bank_transfer', 'check', 'crypto', 'gift_card')`);
        await queryRunner.query(`CREATE TYPE "public"."cash_flow_status_enum" AS ENUM('pending', 'authorized', 'completed', 'failed', 'refunded', 'partially_refunded', 'canceled', 'expired', 'requires_action')`);
        await queryRunner.query(`CREATE TYPE "public"."cash_flow_currency_enum" AS ENUM('RON', 'EUR', 'USD')`);
        await queryRunner.query(`CREATE TABLE "cash_flow" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "direction" "public"."cash_flow_direction_enum" NOT NULL DEFAULT 'in', "category_type" "public"."cash_flow_category_type_enum" NOT NULL DEFAULT 'revenue', "category" "public"."cash_flow_category_enum" NOT NULL DEFAULT 'customer', "gateway" "public"."cash_flow_gateway_enum" NOT NULL DEFAULT 'direct', "method" "public"."cash_flow_method_enum" NOT NULL DEFAULT 'cash', "status" "public"."cash_flow_status_enum" NOT NULL DEFAULT 'pending', "amount" integer NOT NULL, "vat_rate" numeric(5,2) NOT NULL, "currency" "public"."cash_flow_currency_enum" NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "external_reference" character varying, "parent_id" integer, "transaction_id" character varying, "gateway_response" jsonb, "fail_reason" text, "captured_at" TIMESTAMP, "authorized_at" TIMESTAMP, "notes" text, CONSTRAINT "CHK_40be479c177b159218c6b66b1b" CHECK (
  (
    -- Direction + amount consistency for originals
    (parent_id IS NULL AND 
      ((category_type = 'revenue' AND direction = 'in' AND amount > 0) OR
       (category_type = 'expense' AND direction = 'out' AND amount < 0))
    )

    -- Refunds / corrections
    OR (parent_id IS NOT NULL AND category_type = 'correction')
  )
), CONSTRAINT "PK_e28117f3ef2dc17143db0cb7ce1" PRIMARY KEY ("id")); COMMENT ON COLUMN "cash_flow"."amount" IS 'Amount intended to be charged; Note: It store cents; always divide by 100 for value'; COMMENT ON COLUMN "cash_flow"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = default currency)'; COMMENT ON COLUMN "cash_flow"."parent_id" IS 'Parent payment ID (e.g.: for refunds)'; COMMENT ON COLUMN "cash_flow"."transaction_id" IS 'Gateway transaction ID (e.g., Stripe charge id)'; COMMENT ON COLUMN "cash_flow"."gateway_response" IS 'Full gateway response snapshot for debugging/audit'`);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flow_external_reference" ON "cash_flow" ("external_reference") `);
        await queryRunner.query(`CREATE INDEX "IDX_parent_id" ON "cash_flow" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flow_status_created_at" ON "cash_flow" ("status", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flow_method_status" ON "cash_flow" ("method", "status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cash_flow_gateway_transaction_id" ON "cash_flow" ("gateway", "transaction_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flow_gateway_status" ON "cash_flow" ("gateway", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flow_category_created_at" ON "cash_flow" ("category", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flow_category_type_created_at" ON "cash_flow" ("category_type", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_cash_flow_created_at" ON "cash_flow" ("created_at") `);
        await queryRunner.query(`COMMENT ON TABLE "cash_flow" IS 'Tracks cash flows.'`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "views"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "language"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "author"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "brief"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "content_blocks"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "meta"`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "updated_at" TIMESTAMP DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "language" character varying(3) NOT NULL DEFAULT 'en'`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "slug" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "author" jsonb`);
        await queryRunner.query(`COMMENT ON COLUMN "article_content"."author" IS 'Author details'`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "title" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "brief" text`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "content" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "content_blocks" jsonb`);
        await queryRunner.query(`COMMENT ON COLUMN "article_content"."content_blocks" IS 'Reserved column for future use'`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "meta" jsonb`);
        await queryRunner.query(`COMMENT ON COLUMN "article_content"."meta" IS 'SEO metadata for article pages.'`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "views" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c" UNIQUE ("article_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("slug", "language") `);
        await queryRunner.query(`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `);
        await queryRunner.query(`ALTER TABLE "cash_flow" ADD CONSTRAINT "FK_834b8e126ec58955db3a985edfb" FOREIGN KEY ("parent_id") REFERENCES "cash_flow"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`);
        await queryRunner.query(`ALTER TABLE "cash_flow" DROP CONSTRAINT "FK_834b8e126ec58955db3a985edfb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_article_track_article_id_unique"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_article_content_unique_per_lang"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_article_content_slug_lang"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c"`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "views"`);
        await queryRunner.query(`COMMENT ON COLUMN "article_content"."meta" IS 'SEO metadata for article pages.'`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "meta"`);
        await queryRunner.query(`COMMENT ON COLUMN "article_content"."content_blocks" IS 'Reserved column for future use'`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "content_blocks"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "brief"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "title"`);
        await queryRunner.query(`COMMENT ON COLUMN "article_content"."author" IS 'Author details'`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "author"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "language"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "article_content" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "meta" jsonb`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "content_blocks" jsonb`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "content" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "brief" text`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "title" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "author" jsonb`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "slug" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "language" character varying(3) NOT NULL DEFAULT 'en'`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "updated_at" TIMESTAMP DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`);
        await queryRunner.query(`ALTER TABLE "article_content" ADD "views" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON TABLE "cash_flow" IS NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flow_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flow_category_type_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flow_category_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flow_gateway_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flow_gateway_transaction_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flow_method_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flow_status_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cash_flow_external_reference"`);
        await queryRunner.query(`DROP TABLE "cash_flow"`);
        await queryRunner.query(`DROP TYPE "public"."cash_flow_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cash_flow_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cash_flow_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cash_flow_gateway_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cash_flow_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cash_flow_category_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cash_flow_direction_enum"`);
        await queryRunner.query(`COMMENT ON TABLE "article_content" IS 'Track article views, etc.'`);
        await queryRunner.query(`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("language", "slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `);
    }

}
