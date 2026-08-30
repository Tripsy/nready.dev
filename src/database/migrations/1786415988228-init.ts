import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1786415988228 implements MigrationInterface {
	name = 'Init1786415988228';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "address" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "city_id" integer, "details" text NOT NULL, "postal_code" character varying, CONSTRAINT "PK_d92de1f82754668b5f5f5dd4fd5" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_address_city_id" ON "address"  ("city_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_address_deleted_at" ON "address"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(`COMMENT ON TABLE "address" IS 'Addresses'`);
		await queryRunner.query(
			`CREATE TABLE "article_content" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "article_id" integer NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "slug" character varying NOT NULL, "author" jsonb, "title" text NOT NULL, "brief" text, "content" text NOT NULL, "content_blocks" jsonb, "meta" jsonb, CONSTRAINT "PK_5673d4aa27bd95298796b8abec7" PRIMARY KEY ("id")); COMMENT ON COLUMN "article_content"."author" IS 'Author details'; COMMENT ON COLUMN "article_content"."content_blocks" IS 'Reserved column for future use'; COMMENT ON COLUMN "article_content"."meta" IS 'SEO metadata, canonical URL, images, structured data, etc.'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content"  ("slug", "language") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_unique_per_lang" ON "article_content"  ("article_id", "language") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_deleted_at" ON "article_content"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_content" IS 'Language-specific content for articles (title, slug, brief, content, meta)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "brand_content" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "brand_id" integer NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "description" text, "meta" jsonb, CONSTRAINT "PK_8e9d5488729b396e59d9144ea27" PRIMARY KEY ("id")); COMMENT ON COLUMN "brand_content"."meta" IS 'SEO metadata, canonical URL, images, structured data, etc.'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_content_deleted_at" ON "brand_content"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_brand_content_unique_per_lang" ON "brand_content"  ("brand_id", "language") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "brand_content" IS 'Language-specific content for brands (descriptions, meta)'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."article_status_enum" AS ENUM('draft', 'pending', 'rejected', 'scheduled', 'published', 'archived')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."article_layout_enum" AS ENUM('default')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."article_featured_status_enum" AS ENUM('section', 'category')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."article_visibility_enum" AS ENUM('public', 'restricted')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."article_source_mode_enum" AS ENUM('input', 'parsed')`,
		);
		await queryRunner.query(
			`CREATE TABLE "article" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."article_status_enum" NOT NULL DEFAULT 'draft', "layout" "public"."article_layout_enum" NOT NULL DEFAULT 'default', "details" jsonb, "publish_at" TIMESTAMP, "archive_at" TIMESTAMP, "featured_status" "public"."article_featured_status_enum", "featured_order" integer NOT NULL DEFAULT '0', "visibility" "public"."article_visibility_enum" NOT NULL DEFAULT 'public', "public_at" TIMESTAMP, "source_mode" "public"."article_source_mode_enum" NOT NULL DEFAULT 'input', "source" jsonb, "author_id" integer, CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id")); COMMENT ON COLUMN "article"."details" IS 'Reserved column for future use'; COMMENT ON COLUMN "article"."publish_at" IS 'Controls when the article should be displayed'; COMMENT ON COLUMN "article"."archive_at" IS 'Controls when the article should transition to archived'; COMMENT ON COLUMN "article"."featured_order" IS 'Order/position of the article within the featured group; Relevant only when featured_status is set'; COMMENT ON COLUMN "article"."public_at" IS 'Controls when the article with restricted visibility should transition to public'; COMMENT ON COLUMN "article"."source" IS 'Source attribution for display (label, url, disclaimer, about)'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_author_id" ON "article"  ("author_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_public_at" ON "article"  ("public_at") WHERE public_at IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_archive_at" ON "article"  ("archive_at") WHERE archive_at IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_featured" ON "article"  ("featured_status", "featured_order") WHERE featured_status IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_status_publish_at" ON "article"  ("status", "publish_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_deleted_at" ON "article"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article" IS 'Stores core article information; textual content is saved in article-content.entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "carrier" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "website" character varying, "phone" character varying, "email" character varying, "notes" text, CONSTRAINT "PK_f615ebd1906f0270d41b3a5a8b0" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_carrier_name" ON "carrier"  ("name") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_carrier_deleted_at" ON "carrier"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "carrier" IS 'Stores shipping carriers'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."operational_record_operational_record_type_enum" AS ENUM('client', 'vendor')`,
		);
		await queryRunner.query(
			`CREATE TABLE "operational_record" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "cash_flow_id" integer NOT NULL, "operational_record_type" "public"."operational_record_operational_record_type_enum" NOT NULL, "entity_id" integer NOT NULL, "notes" text, CONSTRAINT "PK_5455e9f4362fb1f5c3385a42a19" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_operational_record_entity_id" ON "operational_record"  ("entity_id", "operational_record_type") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_operational_record_cash_flow_id" ON "operational_record"  ("cash_flow_id", "operational_record_type") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_operational_record_deleted_at" ON "operational_record"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "operational_record" IS 'Store operational records linked with cash flow operations.'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_direction_enum" AS ENUM('in', 'out')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_category_type_enum" AS ENUM('revenue', 'expense', 'correction')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_category_enum" AS ENUM('customer', 'vendor', 'insurance', 'taxes', 'refund')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_method_enum" AS ENUM('credit_card', 'debit_card', 'paypal', 'cash', 'bank_transfer', 'check', 'crypto', 'gift_card')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_status_enum" AS ENUM('pending', 'authorized', 'completed', 'failed', 'canceled', 'expired', 'requires_action')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_currency_enum" AS ENUM('RON', 'EUR', 'USD')`,
		);
		await queryRunner.query(`CREATE TABLE "cash_flow" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "direction" "public"."cash_flow_direction_enum" NOT NULL DEFAULT 'in', "category_type" "public"."cash_flow_category_type_enum" NOT NULL DEFAULT 'revenue', "category" "public"."cash_flow_category_enum" NOT NULL DEFAULT 'customer', "method" "public"."cash_flow_method_enum" NOT NULL DEFAULT 'cash', "status" "public"."cash_flow_status_enum" NOT NULL DEFAULT 'pending', "amount" integer NOT NULL, "vat_rate" numeric(5,2) NOT NULL, "currency" "public"."cash_flow_currency_enum" NOT NULL DEFAULT 'EUR', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "external_reference" character varying, "parent_id" integer, "notes" text, CONSTRAINT "CHK_83b1bdb1c4cba011ebdd13239d" CHECK ((amount > 0)), CONSTRAINT "CHK_11adeb007366477372a65a2555" CHECK (
  (
    -- Direction + amount consistency for originals
    (parent_id IS NULL AND 
      ((category_type = 'revenue' AND direction = 'in') OR
       (category_type = 'expense' AND direction = 'out')))
  )
  OR 
  (
    -- Refunds / corrections
    (parent_id IS NOT NULL AND category_type = 'correction')
  )
), CONSTRAINT "PK_e28117f3ef2dc17143db0cb7ce1" PRIMARY KEY ("id")); COMMENT ON COLUMN "cash_flow"."amount" IS 'Amount intended to be charged; Note: Divide by 10000 for actual value. e.g. 806452 = 80.6452'; COMMENT ON COLUMN "cash_flow"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = default currency)'; COMMENT ON COLUMN "cash_flow"."parent_id" IS 'Parent payment ID (e.g.: for refunds)'`);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_external_reference" ON "cash_flow"  ("external_reference") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_parent_id" ON "cash_flow"  ("parent_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_status_created_at" ON "cash_flow"  ("status", "created_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_method_status" ON "cash_flow"  ("method", "status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_category_created_at" ON "cash_flow"  ("category", "created_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_created_at" ON "cash_flow"  ("created_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_deleted_at" ON "cash_flow"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "cash_flow" IS 'Tracks cash flows.'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."category_status_enum" AS ENUM('active', 'pending', 'inactive')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."category_type_enum" AS ENUM('product', 'article')`,
		);
		await queryRunner.query(
			`CREATE TABLE "category" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."category_status_enum" NOT NULL DEFAULT 'pending', "type" "public"."category_type_enum" NOT NULL DEFAULT 'product', "sort_order" integer NOT NULL DEFAULT '0', "details" jsonb, "parent_id" integer, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id")); COMMENT ON COLUMN "category"."type" IS 'Specifies the entity type this category belongs to'; COMMENT ON COLUMN "category"."sort_order" IS 'Sort order among siblings'; COMMENT ON COLUMN "category"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_parent_id" ON "category"  ("parent_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_type" ON "category"  ("type", "status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_deleted_at" ON "category"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "category" IS 'Hierarchical product categories'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."client_client_type_enum" AS ENUM('person', 'company')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."client_status_enum" AS ENUM('active', 'inactive', 'pending')`,
		);
		await queryRunner.query(
			`CREATE TABLE "client" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "client_type" "public"."client_client_type_enum" NOT NULL, "status" "public"."client_status_enum" NOT NULL DEFAULT 'pending', "company_name" character varying, "company_cui" character varying, "company_reg_com" character varying, "person_name" character varying, "person_identification_number" character varying, "iban" character varying, "bank_name" character varying, "contact_name" character varying, "contact_email" character varying, "contact_phone" character varying, "notes" text, CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_client_cnp_unique" ON "client"  ("person_identification_number") WHERE person_identification_number IS NOT NULL AND client_type = 'person' AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_client_reg_com_unique" ON "client"  ("company_reg_com") WHERE company_reg_com IS NOT NULL AND client_type = 'company' AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_client_cui_unique" ON "client"  ("company_cui") WHERE company_cui IS NOT NULL AND client_type = 'company' AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_client_company_name_unique" ON "client"  ("company_name") WHERE company_name IS NOT NULL AND client_type = 'company' AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_client_deleted_at" ON "client"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "client" IS 'Stores client information for persons OR companies'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."discount_scope_enum" AS ENUM('client', 'order', 'product', 'category', 'country')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."discount_reason_enum" AS ENUM('flash_sale', 'first_time_customer', 'loyalty_discount', 'birthday_discount', 'referral_discount', 'vip_discount', 'special_discount')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."discount_type_enum" AS ENUM('percent', 'amount')`,
		);
		await queryRunner.query(
			`CREATE TABLE "discount" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "label" character varying NOT NULL, "scope" "public"."discount_scope_enum" NOT NULL, "reason" "public"."discount_reason_enum" NOT NULL, "reference" character varying, "type" "public"."discount_type_enum" NOT NULL, "rules" jsonb, "value" numeric(12,2) NOT NULL, "start_at" TIMESTAMP, "end_at" TIMESTAMP, "notes" text, CONSTRAINT "PK_d05d8712e429673e459e7f1cddb" PRIMARY KEY ("id")); COMMENT ON COLUMN "discount"."label" IS 'Discount name'; COMMENT ON COLUMN "discount"."reference" IS 'Coupon code, referral code, etc'; COMMENT ON COLUMN "discount"."rules" IS 'Optional rules or conditions for discount applicability'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_scope" ON "discount"  ("scope") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_reason" ON "discount"  ("reason") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_reference" ON "discount"  ("reference") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_active" ON "discount"  ("start_at", "end_at", "scope") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_deleted_at" ON "discount"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "discount" IS 'Stores discount definitions. Note: Discount applied only for prices without VAT before exchange rate conversion'`,
		);
		await queryRunner.query(
			`CREATE TABLE "image_content" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "image_id" integer NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "title" text, "description" text, CONSTRAINT "PK_7f5b75103fb93c4bc1c1fd46496" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_image_content_unique_per_lang" ON "image_content"  ("image_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "image_content" IS 'Language-specific content for images'`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."permission" ("id" SERIAL NOT NULL, "entity" character varying NOT NULL, "operation" character varying NOT NULL, "deleted_at" TIMESTAMP, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_permission" ON "system"."permission"  ("entity", "operation") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_permission_deleted_at" ON "system"."permission"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."permission" IS 'Stores permissions'`,
		);
		await queryRunner.query(
			`CREATE TYPE "system"."mail_queue_status_enum" AS ENUM('pending', 'sent', 'error')`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."mail_queue" ("id" SERIAL NOT NULL, "template_id" integer, "language" character varying(3) NOT NULL, "content" jsonb NOT NULL, "to" jsonb NOT NULL, "from" jsonb, "status" "system"."mail_queue_status_enum" NOT NULL DEFAULT 'pending', "error" text, "sent_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_fc59283e1a31da3ce216089305b" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."mail_queue"."content" IS 'Email content: subject, text, html, vars, layout'; COMMENT ON COLUMN "system"."mail_queue"."to" IS 'To: name & address'; COMMENT ON COLUMN "system"."mail_queue"."from" IS 'From: name & address'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_mail_queue_template_id" ON "system"."mail_queue"  ("template_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_mail_queue_status" ON "system"."mail_queue"  ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_mail_queue_sent_at" ON "system"."mail_queue"  ("sent_at") `,
		);
		await queryRunner.query(
			`CREATE TYPE "system"."template_type_enum" AS ENUM('page', 'email')`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."template" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "label" character varying NOT NULL, "language" character varying(3) NOT NULL, "type" "system"."template_type_enum" NOT NULL DEFAULT 'page', "content" jsonb NOT NULL, CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."template"."content" IS 'Template data'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_label_language_type" ON "system"."template"  ("label", "language", "type") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_template_deleted_at" ON "system"."template"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."template" IS 'Stores email & page templates'`,
		);
		await queryRunner.query(
			`CREATE TYPE "logs"."log_data_category_enum" AS ENUM('system', 'history', 'cron', 'info', 'error')`,
		);
		await queryRunner.query(
			`CREATE TYPE "logs"."log_data_level_enum" AS ENUM('trace', 'debug', 'info', 'warn', 'error', 'fatal')`,
		);
		await queryRunner.query(
			`CREATE TABLE "logs"."log_data" ("id" SERIAL NOT NULL, "pid" character(36) NOT NULL, "request_id" character varying, "category" "logs"."log_data_category_enum" NOT NULL, "level" "logs"."log_data_level_enum" NOT NULL, "message" text NOT NULL, "context" text, "debug_stack" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee6ddd7720fe93171a6b62e4be6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_data_pid" ON "logs"."log_data"  ("pid") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_data_request_id" ON "logs"."log_data"  ("request_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_data" ON "logs"."log_data"  ("level", "category", "created_at") `,
		);
		await queryRunner.query(
			`CREATE TABLE "place_content" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "place_id" integer NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "name" character varying NOT NULL, "type_label" character varying NOT NULL, "details" jsonb, CONSTRAINT "PK_5af1716076889988270c39bd6ff" PRIMARY KEY ("id")); COMMENT ON COLUMN "place_content"."type_label" IS 'ex: Country, Region, City, Oras, Judet'; COMMENT ON COLUMN "place_content"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_place_content_unique_per_lang" ON "place_content"  ("place_id", "language") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_content_deleted_at" ON "place_content"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "place_content" IS 'Language-specific content for places'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."image_section_enum" AS ENUM('product', 'category', 'brand', 'article')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."image_image_type_enum" AS ENUM('logo', 'gallery')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."image_storage_enum" AS ENUM('local', 's3')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."image_status_enum" AS ENUM('active', 'inactive')`,
		);
		await queryRunner.query(
			`CREATE TABLE "image" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "section" "public"."image_section_enum" NOT NULL, "entity_id" integer NOT NULL, "image_type" "public"."image_image_type_enum" NOT NULL, "storage" "public"."image_storage_enum" NOT NULL DEFAULT 'local', "path" text NOT NULL, "properties" jsonb, "status" "public"."image_status_enum" NOT NULL DEFAULT 'active', "sort_order" integer NOT NULL DEFAULT '0', "details" jsonb, CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY ("id")); COMMENT ON COLUMN "image"."section" IS 'The section this image belongs to'; COMMENT ON COLUMN "image"."entity_id" IS 'ID of the entity this image is linked to'; COMMENT ON COLUMN "image"."image_type" IS 'The type of the image'; COMMENT ON COLUMN "image"."storage" IS 'The storage destination of the image'; COMMENT ON COLUMN "image"."properties" IS 'Properties of the file'; COMMENT ON COLUMN "image"."sort_order" IS 'Order/position of the image within the entity type'; COMMENT ON COLUMN "image"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_storage" ON "image"  ("storage") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_type_id" ON "image"  ("entity_id", "section", "image_type") `,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."place_place_type_enum" AS ENUM('country', 'region', 'city')`,
		);
		await queryRunner.query(
			`CREATE TABLE "place" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "place_type" "public"."place_place_type_enum" NOT NULL DEFAULT 'country', "parent_id" integer, "code" character varying(3), CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca" PRIMARY KEY ("id")); COMMENT ON COLUMN "place"."code" IS 'Abbreviation'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_parent_id" ON "place"  ("parent_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_code" ON "place"  ("code") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_deleted_at" ON "place"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "place" IS 'Places (countries, regions, cities)'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."brand_status_enum" AS ENUM('active', 'inactive')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."brand_brand_type_enum" AS ENUM('product')`,
		);
		await queryRunner.query(
			`CREATE TABLE "brand" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "slug" character varying NOT NULL, "status" "public"."brand_status_enum" NOT NULL DEFAULT 'active', "brand_type" "public"."brand_brand_type_enum" NOT NULL DEFAULT 'product', "sort_order" integer NOT NULL DEFAULT '0', "details" jsonb, CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f" PRIMARY KEY ("id")); COMMENT ON COLUMN "brand"."brand_type" IS 'Specifies the entity type this brand belongs to'; COMMENT ON COLUMN "brand"."sort_order" IS 'Order/position of the brand in a listing'; COMMENT ON COLUMN "brand"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_brand_slug" ON "brand"  ("slug", "brand_type") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_deleted_at" ON "brand"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."category_content_type_enum" AS ENUM('product', 'article')`,
		);
		await queryRunner.query(
			`CREATE TABLE "category_content" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "category_id" integer NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "type" "public"."category_content_type_enum" NOT NULL, "label" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "meta" jsonb, "details" jsonb, CONSTRAINT "PK_266faccfe1a64cd9a8e5479deed" PRIMARY KEY ("id")); COMMENT ON COLUMN "category_content"."type" IS 'The type is duplicated here from category to be used as unique index'; COMMENT ON COLUMN "category_content"."meta" IS 'SEO metadata, canonical URL, images, structured data, etc.'; COMMENT ON COLUMN "category_content"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_category_content_slug_language" ON "category_content"  ("type", "slug", "language") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_category_content_category_id_language" ON "category_content"  ("category_id", "language") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_content_deleted_at" ON "category_content"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "category_content" IS 'Language-specific category content (slug, description, metadata)'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."vendor_type_enum" AS ENUM('supplier', 'provider')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."vendor_status_enum" AS ENUM('active', 'inactive', 'pending')`,
		);
		await queryRunner.query(
			`CREATE TABLE "vendor" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "type" "public"."vendor_type_enum" NOT NULL DEFAULT 'supplier', "status" "public"."vendor_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_931a23f6231a57604f5a0e32780" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_name" ON "vendor"  ("name") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_type" ON "vendor"  ("type") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_status" ON "vendor"  ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_deleted_at" ON "vendor"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(`COMMENT ON TABLE "vendor" IS 'Store vendors'`);
		await queryRunner.query(
			`CREATE TYPE "public"."user_status_enum" AS ENUM('active', 'inactive', 'pending')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'member', 'operator')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."user_operator_type_enum" AS ENUM('seller', 'product_manager', 'content_editor')`,
		);
		await queryRunner.query(
			`CREATE TABLE "user" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "email" character varying NOT NULL, "email_verified_at" TIMESTAMP, "password" character varying, "password_updated_at" TIMESTAMP NOT NULL, "language" character varying(3) NOT NULL, "status" "public"."user_status_enum" NOT NULL DEFAULT 'pending', "role" "public"."user_role_enum" NOT NULL DEFAULT 'member', "operator_type" "public"."user_operator_type_enum", CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")); COMMENT ON COLUMN "user"."operator_type" IS 'Operator type; only relevant when role is OPERATOR'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_user_email" ON "user"  ("email") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_user_deleted_at" ON "user"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE TABLE "user_permission" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "permission_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_a7326749e773c740a7104634a77" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_user_permission_permission_id" ON "user_permission"  ("permission_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_user_permission_permission" ON "user_permission"  ("user_id", "permission_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_user_permission_deleted_at" ON "user_permission"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "user_permission" IS 'Stores user permissions'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."term_type_enum" AS ENUM('tag', 'attribute_label', 'attribute_value', 'text')`,
		);
		await queryRunner.query(
			`CREATE TABLE "term" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."term_type_enum" NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "value" character varying(255) NOT NULL, "details" jsonb, CONSTRAINT "PK_55b0479f0743f2e5d5ec414821e" PRIMARY KEY ("id")); COMMENT ON COLUMN "term"."language" IS 'ISO language code (en will the fallback for universal terms)'; COMMENT ON COLUMN "term"."value" IS 'Localized or universal term value'; COMMENT ON COLUMN "term"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_term_type" ON "term"  ("type") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_term_language" ON "term"  ("language") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_term_unique" ON "term"  ("type", "language", "value") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_term_deleted_at" ON "term"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "term" IS 'Multilingual taxonomy terms: categories, tags, attribute labels/values'`,
		);
		await queryRunner.query(
			`CREATE TABLE "article_category" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "article_id" integer NOT NULL, "category_id" integer NOT NULL, "details" jsonb, CONSTRAINT "PK_cdd234ef147c8552a8abd42bd29" PRIMARY KEY ("id")); COMMENT ON COLUMN "article_category"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_category_category_id" ON "article_category"  ("category_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_category_deleted_at" ON "article_category"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_category_unique" ON "article_category"  ("article_id", "category_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_category" IS 'Link articles to categories'`,
		);
		await queryRunner.query(
			`CREATE TABLE "article_tag" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "article_id" integer NOT NULL, "tag_id" integer NOT NULL, "details" jsonb, CONSTRAINT "PK_43dc2fa69a4739ce178e021d649" PRIMARY KEY ("id")); COMMENT ON COLUMN "article_tag"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_tag_tag_id" ON "article_tag"  ("tag_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_tag_unique" ON "article_tag"  ("article_id", "tag_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_tag_deleted_at" ON "article_tag"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_tag" IS 'Links articles to tag terms'`,
		);
		await queryRunner.query(
			`CREATE TABLE "article_visibility_rule" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "article_id" integer NOT NULL, "requires_auth" boolean NOT NULL DEFAULT false, "requires_subscription" character varying array, "allowed_countries" character varying(2) array, "password" character varying, "is_listed" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_4a239efc040ebec82f2736f490" UNIQUE ("article_id"), CONSTRAINT "PK_f14deeb133759688c6364b51a08" PRIMARY KEY ("id")); COMMENT ON COLUMN "article_visibility_rule"."requires_auth" IS 'Only logged-in users can view the article'; COMMENT ON COLUMN "article_visibility_rule"."requires_subscription" IS 'Subscription plan identifiers granting access; null means subscription is not required'; COMMENT ON COLUMN "article_visibility_rule"."allowed_countries" IS 'ISO 3166-1 alpha-2 codes allowed to view; null means no country restriction'; COMMENT ON COLUMN "article_visibility_rule"."password" IS 'Hashed password required to view the article'; COMMENT ON COLUMN "article_visibility_rule"."is_listed" IS 'Whether the article is listed in indexes, feeds and search'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_visibility_rule_deleted_at" ON "article_visibility_rule"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_visibility_rule" IS 'Visibility rules for articles with restricted visibility'`,
		);
		await queryRunner.query(
			`CREATE TYPE "system"."account_identity_provider_enum" AS ENUM('google', 'facebook')`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."account_identity" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "provider" "system"."account_identity_provider_enum" NOT NULL, "provider_user_id" character varying(191) NOT NULL, "email" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_login_at" TIMESTAMP, CONSTRAINT "PK_ff3623f6775193bb2a7286c2e81" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."account_identity"."provider_user_id" IS 'Subject id as reported by the provider (\`sub\` / Graph \`id\`)'; COMMENT ON COLUMN "system"."account_identity"."email" IS 'Email reported by the provider at link time; kept for auditing only'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_account_identity_user_provider" ON "system"."account_identity"  ("user_id", "provider") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_account_identity_provider_subject" ON "system"."account_identity"  ("provider", "provider_user_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_identity" IS 'Links a user to an external identity provider (social sign-in)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."account_token" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "ident" character(36) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" json, "used_at" TIMESTAMP, "expire_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_a55842d3341d42534e39f85e931" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."account_token"."metadata" IS 'Fingerprinting data'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_account_token_user_id" ON "system"."account_token"  ("user_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_account_token_ident" ON "system"."account_token"  ("ident") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_token" IS 'Stores \`ident\` for account tokens to manage token revocation'`,
		);
		await queryRunner.query(
			`CREATE TYPE "logs"."cron_history_status_enum" AS ENUM('error', 'ok', 'warning')`,
		);
		await queryRunner.query(
			`CREATE TABLE "logs"."cron_history" ("id" SERIAL NOT NULL, "label" character varying NOT NULL, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "status" "logs"."cron_history_status_enum" NOT NULL, "run_time" smallint NOT NULL DEFAULT '0', "content" jsonb, CONSTRAINT "PK_459b846bf883b0de2833b411c19" PRIMARY KEY ("id")); COMMENT ON COLUMN "logs"."cron_history"."run_time" IS 'Run time in seconds'; COMMENT ON COLUMN "logs"."cron_history"."content" IS 'Cron data'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cron_history_start_at" ON "logs"."cron_history"  ("start_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cron_history_status" ON "logs"."cron_history"  ("status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "logs"."cron_history" IS 'Stores cron usage'`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."account_recovery" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "ident" character(36) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" json, "used_at" TIMESTAMP, "expire_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_d4901111d598239fd13e230f618" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."account_recovery"."metadata" IS 'Fingerprinting data'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_account_recovery_user_id" ON "system"."account_recovery"  ("user_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_account_recovery_ident" ON "system"."account_recovery"  ("ident") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_recovery" IS 'Stores \`ident\` for account password recovery requests'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."grn_status_enum" AS ENUM('draft', 'confirmed', 'canceled')`,
		);
		await queryRunner.query(
			`CREATE TABLE "grn" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "ref_code" character varying(3) NOT NULL, "ref_number" integer NOT NULL, "supplier_document_number" character varying, "status" "public"."grn_status_enum" NOT NULL DEFAULT 'draft', "received_at" TIMESTAMP NOT NULL, "confirmed_at" TIMESTAMP, "currency" character(3) NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "notes" text, "warehouse_id" integer NOT NULL, "vendor_id" integer NOT NULL, CONSTRAINT "PK_c8f750cac4dfd1fc623593ab3eb" PRIMARY KEY ("id")); COMMENT ON COLUMN "grn"."ref_code" IS 'Document series, e.g. NIR'; COMMENT ON COLUMN "grn"."ref_number" IS 'Sequential number within the series'; COMMENT ON COLUMN "grn"."supplier_document_number" IS 'The supplier''s own delivery note or invoice number'; COMMENT ON COLUMN "grn"."received_at" IS 'When the goods physically arrived; drives FIFO order'; COMMENT ON COLUMN "grn"."confirmed_at" IS 'When the stock actually moved'; COMMENT ON COLUMN "grn"."currency" IS 'Currency the supplier invoiced in'; COMMENT ON COLUMN "grn"."exchange_rate" IS 'Rate to the base currency (1 = same currency)'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_grn_supplier_document_number" ON "grn"  ("supplier_document_number") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_grn_warehouse_id" ON "grn"  ("warehouse_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_grn_vendor_id" ON "grn"  ("vendor_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_grn_warehouse_status_received_at" ON "grn"  ("warehouse_id", "status", "received_at") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_grn_ref" ON "grn"  ("ref_code", "ref_number") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_grn_deleted_at" ON "grn"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "grn" IS 'Goods received notes; the only way stock enters a warehouse, and the source of every FIFO lot'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."invoice_status_enum" AS ENUM('draft', 'issued', 'paid', 'overdue', 'canceled', 'refunded')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."invoice_type_enum" AS ENUM('charge', 'proforma', 'credit_note')`,
		);
		await queryRunner.query(
			`CREATE TABLE "invoice" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" integer NOT NULL, "ref_code" character varying(3) NOT NULL, "ref_number" integer NOT NULL, "status" "public"."invoice_status_enum" NOT NULL DEFAULT 'draft', "type" "public"."invoice_type_enum" NOT NULL DEFAULT 'charge', "base_currency" character(3) NOT NULL DEFAULT 'RON', "discount" jsonb, "issued_at" TIMESTAMP NOT NULL, "due_at" TIMESTAMP, "paid_at" TIMESTAMP, "billing_details" jsonb, "details" jsonb, "notes" text, CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id")); COMMENT ON COLUMN "invoice"."ref_code" IS 'Invoice series/code, e.g., ABC'; COMMENT ON COLUMN "invoice"."ref_number" IS 'Sequential invoice number within the series'; COMMENT ON COLUMN "invoice"."base_currency" IS 'Base currency for the invoice'; COMMENT ON COLUMN "invoice"."discount" IS 'Array of discount snapshots applied'; COMMENT ON COLUMN "invoice"."billing_details" IS 'Snapshot of billing info at the moment of issuing the invoice'; COMMENT ON COLUMN "invoice"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_order_id" ON "invoice"  ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_status" ON "invoice"  ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_type" ON "invoice"  ("type") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_invoice_ref" ON "invoice"  ("ref_number", "ref_code") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_deleted_at" ON "invoice"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "invoice" IS 'Stores invoices generated from orders'`,
		);
		await queryRunner.query(
			`CREATE TABLE "grn_item" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "grn_id" integer NOT NULL, "variant_id" integer NOT NULL, "qty" numeric(12,2) NOT NULL, "qty_remaining" numeric(12,2) NOT NULL DEFAULT '0', "unit_cost" numeric(12,2) NOT NULL, "unit_cost_base" numeric(12,4) NOT NULL, "vat_rate" numeric(5,2) NOT NULL DEFAULT '0', "lot_code" character varying, "expires_at" date, "notes" text, CONSTRAINT "CHK_aa436f46cf91e3341bcf3029a4" CHECK ((unit_cost_base >= 0)), CONSTRAINT "CHK_2a6f7dd1ff8c2e4591b7c8779f" CHECK ((unit_cost >= 0)), CONSTRAINT "CHK_f5878ab091acacbd4ed45f07fb" CHECK ((qty_remaining >= 0 AND qty_remaining <= qty)), CONSTRAINT "CHK_0acd56d60a2530cfdd485dcebf" CHECK ((qty > 0)), CONSTRAINT "PK_59d7f54b35043e6a4e4dfa48998" PRIMARY KEY ("id")); COMMENT ON COLUMN "grn_item"."qty" IS 'Quantity received; never changes once confirmed'; COMMENT ON COLUMN "grn_item"."qty_remaining" IS 'Quantity still in this lot; 0 means the lot is closed'; COMMENT ON COLUMN "grn_item"."unit_cost" IS 'Unit cost as invoiced, in the receipt currency'; COMMENT ON COLUMN "grn_item"."unit_cost_base" IS 'Unit cost in base currency, frozen at the receipt exchange rate'; COMMENT ON COLUMN "grn_item"."vat_rate" IS 'VAT rate on the purchase, for the payable'; COMMENT ON COLUMN "grn_item"."lot_code" IS 'The supplier''s batch identifier, when they give one'; COMMENT ON COLUMN "grn_item"."expires_at" IS 'Expiry date of this lot, when the goods carry one'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_grn_item_variant_id" ON "grn_item"  ("variant_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_grn_item_variant_open" ON "grn_item"  ("variant_id") WHERE qty_remaining > 0 AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_grn_item_unique" ON "grn_item"  ("grn_id", "variant_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_grn_item_deleted_at" ON "grn_item"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "grn_item" IS 'Received lines; each is a FIFO lot, and qty_remaining is the authoritative on-hand figure'`,
		);
		await queryRunner.query(
			`CREATE TABLE "logs"."log_history" ("id" SERIAL NOT NULL, "entity" character varying NOT NULL, "entity_id" integer NOT NULL, "action" character varying NOT NULL, "auth_id" integer, "performed_by" character varying NOT NULL, "request_id" character varying NOT NULL, "source" character varying NOT NULL, "recorded_at" TIMESTAMP NOT NULL, "details" jsonb, CONSTRAINT "PK_837ee3d001208e2b7400e7a0487" PRIMARY KEY ("id")); COMMENT ON COLUMN "logs"."log_history"."details" IS 'Log data'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_auth_id" ON "logs"."log_history"  ("auth_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_performed_by" ON "logs"."log_history"  ("performed_by") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_request_id" ON "logs"."log_history"  ("request_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_source" ON "logs"."log_history"  ("source") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_recorded_at" ON "logs"."log_history"  ("recorded_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_entity_id_action" ON "logs"."log_history"  ("entity", "entity_id", "action") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "logs"."log_history" IS 'Store entities history: created, updated, deleted, etc.'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."warehouse_movement_movement_type_enum" AS ENUM('receipt', 'sale', 'sale_return', 'supplier_return', 'adjustment', 'write_off', 'transfer_in', 'transfer_out')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."warehouse_movement_source_type_enum" AS ENUM('grn_item', 'order_shipping_product', 'adjustment')`,
		);
		await queryRunner.query(`CREATE TABLE "warehouse_movement" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "movement_type" "public"."warehouse_movement_movement_type_enum" NOT NULL, "qty" numeric(12,2) NOT NULL, "unit_cost_base" numeric(12,4) NOT NULL, "source_type" "public"."warehouse_movement_source_type_enum" NOT NULL, "source_id" integer, "occurred_at" TIMESTAMP NOT NULL, "notes" text, "warehouse_id" integer NOT NULL, "variant_id" integer NOT NULL, "grn_item_id" integer, "reversal_of_id" integer, CONSTRAINT "CHK_4a161e9bde3ac44412cf3ea5f2" CHECK (
	(
		(movement_type IN ('receipt', 'sale_return', 'transfer_in') AND qty > 0)
		OR
		(movement_type IN ('sale', 'supplier_return', 'write_off', 'transfer_out') AND qty < 0)
		OR
		movement_type = 'adjustment'
	)
), CONSTRAINT "CHK_f8456cae1a00926a62c305204e" CHECK ((qty <> 0)), CONSTRAINT "PK_ada0c8b59def45f8963523ffaf1" PRIMARY KEY ("id")); COMMENT ON COLUMN "warehouse_movement"."qty" IS 'Signed quantity; positive is inbound, negative is outbound'; COMMENT ON COLUMN "warehouse_movement"."unit_cost_base" IS 'Cost recognised per unit, in base currency, taken from the lot'; COMMENT ON COLUMN "warehouse_movement"."source_id" IS 'Row in the table named by source_type; no FK, the target varies'; COMMENT ON COLUMN "warehouse_movement"."occurred_at" IS 'When the stock physically moved'; COMMENT ON COLUMN "warehouse_movement"."reversal_of_id" IS 'The movement this one cancels out'`);
		await queryRunner.query(
			`CREATE INDEX "IDX_warehouse_movement_type" ON "warehouse_movement"  ("movement_type") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_warehouse_movement_reversal_of_id" ON "warehouse_movement"  ("reversal_of_id") WHERE reversal_of_id IS NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_warehouse_movement_source" ON "warehouse_movement"  ("source_type", "source_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_warehouse_movement_grn_item_id" ON "warehouse_movement"  ("grn_item_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_warehouse_movement_variant" ON "warehouse_movement"  ("warehouse_id", "variant_id", "occurred_at") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "warehouse_movement" IS 'Append-only ledger of physical stock changes; corrections are reversing rows, never edits'`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_product" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" integer NOT NULL, "parent_id" integer, "variant_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" numeric(12,2) NOT NULL, "vat_rate" numeric(5,2) NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "discount" jsonb, "options" jsonb, "notes" text, CONSTRAINT "CHK_e71eab477ca6cbf5acb9f171d5" CHECK ((vat_rate >= 0)), CONSTRAINT "CHK_be8863bcda53a503e92b119947" CHECK ((price >= 0)), CONSTRAINT "CHK_b1af8657d76f9d945f0980b51d" CHECK ((quantity > 0)), CONSTRAINT "PK_539ede39e518562dfdadfddb492" PRIMARY KEY ("id")); COMMENT ON COLUMN "order_product"."currency" IS 'Currency is specific to client'; COMMENT ON COLUMN "order_product"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = same currency)'; COMMENT ON COLUMN "order_product"."discount" IS 'Array of discount snapshots applied'; COMMENT ON COLUMN "order_product"."options" IS 'Array of option snapshots chosen, each carrying its price delta'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_order_id" ON "order_product"  ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_parent_id" ON "order_product"  ("parent_id") WHERE parent_id IS NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_variant_id" ON "order_product"  ("variant_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_product_id" ON "order_product"  ("product_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_deleted_at" ON "order_product"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order_product" IS 'Stores ordered products (order line items)'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."order_status_enum" AS ENUM('draft', 'pending', 'confirmed', 'completed', 'canceled')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."order_type_enum" AS ENUM('standard', 'subscription')`,
		);
		await queryRunner.query(
			`CREATE TABLE "order" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "client_id" integer NOT NULL, "ref_code" character varying(3) NOT NULL, "ref_number" integer NOT NULL, "status" "public"."order_status_enum" NOT NULL DEFAULT 'draft', "type" "public"."order_type_enum" NOT NULL DEFAULT 'standard', "issued_at" TIMESTAMP NOT NULL, "notes" text, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id")); COMMENT ON COLUMN "order"."ref_code" IS 'Document series, e.g. ORD'; COMMENT ON COLUMN "order"."ref_number" IS 'Sequential number within the series'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_client_id" ON "order"  ("client_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_status" ON "order"  ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_issued_at" ON "order"  ("issued_at") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_order_ref" ON "order"  ("ref_code", "ref_number") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_deleted_at" ON "order"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order" IS 'Stores order information'`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_shipping_product" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_product_id" integer NOT NULL, "order_shipping_id" integer NOT NULL, "quantity" numeric(12,2) NOT NULL, "notes" text, CONSTRAINT "CHK_57a3c56d56194ae524e99f9e04" CHECK ((quantity > 0)), CONSTRAINT "PK_07c1c05392d97859bb43947dfc7" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_product_order_product_id" ON "order_shipping_product"  ("order_product_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_order_shipping_product_unique" ON "order_shipping_product"  ("order_shipping_id", "order_product_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_product_deleted_at" ON "order_shipping_product"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order_shipping_product" IS 'Allocation of ordered products to specific shipments'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."order_shipping_status_enum" AS ENUM('pending', 'preparing', 'shipped', 'delivered', 'failed', 'returned')`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_shipping" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" integer NOT NULL, "status" "public"."order_shipping_status_enum" NOT NULL DEFAULT 'pending', "method" character varying, "carrier_id" integer, "warehouse_id" integer NOT NULL, "tracking_number" character varying, "tracking_url" character varying, "vat_rate" numeric(5,2) NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "discount" jsonb, "contact_name" character varying, "contact_phone" character varying, "contact_email" character varying, "address_country" character varying, "address_region" character varying, "address_city" character varying, "details" character varying, "postal_code" character varying, "shipped_at" TIMESTAMP, "delivered_at" TIMESTAMP, "estimated_delivery_at" TIMESTAMP, "notes" text, CONSTRAINT "PK_9e1174bf865646026aba95d2ae0" PRIMARY KEY ("id")); COMMENT ON COLUMN "order_shipping"."method" IS 'eg: courier, pickup, same-day, own-fleet, etc'; COMMENT ON COLUMN "order_shipping"."currency" IS 'Currency is specific to client'; COMMENT ON COLUMN "order_shipping"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = same currency)'; COMMENT ON COLUMN "order_shipping"."discount" IS 'Array of discount snapshots applied'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_order_id" ON "order_shipping"  ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_status" ON "order_shipping"  ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_method" ON "order_shipping"  ("method") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_carrier_id" ON "order_shipping"  ("carrier_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_warehouse_id" ON "order_shipping"  ("warehouse_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_order_shipping_tracking_number" ON "order_shipping"  ("tracking_number") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_deleted_at" ON "order_shipping"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order_shipping" IS 'Stores shipping details for orders'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_availability" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "day_of_week" smallint, "starts_at" TIME NOT NULL, "ends_at" TIME NOT NULL, "valid_from" date, "valid_until" date, CONSTRAINT "CHK_3f0e5cd351402002527fc2ef76" CHECK ((valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)), CONSTRAINT "CHK_49589a4cb61d4b05607ab4a349" CHECK ((ends_at > starts_at)), CONSTRAINT "CHK_0739a0d7c3f0eaeec9bb58e457" CHECK ((day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6))), CONSTRAINT "PK_2953b5489dac4bd2235d96c2230" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_availability"."day_of_week" IS 'Day this window applies to, 0 = Sunday; NULL means every day'; COMMENT ON COLUMN "product_availability"."starts_at" IS 'Window opens, venue local time'; COMMENT ON COLUMN "product_availability"."ends_at" IS 'Window closes, venue local time'; COMMENT ON COLUMN "product_availability"."valid_from" IS 'First date this window applies; NULL means no lower bound'; COMMENT ON COLUMN "product_availability"."valid_until" IS 'Last date this window applies; NULL means no upper bound'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_availability_product_id" ON "product_availability"  ("product_id", "day_of_week") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_availability_deleted_at" ON "product_availability"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_availability" IS 'Recurring ordering windows for a product; no row at all means unrestricted'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_bundle_group" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "label_id" integer NOT NULL, "min_select" integer NOT NULL DEFAULT '0', "max_select" integer, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "CHK_db5a6646886c80ea72ff7952d3" CHECK ((max_select IS NULL OR max_select >= min_select)), CONSTRAINT "CHK_822a5a74fc80e1915026de1c0c" CHECK ((min_select >= 0)), CONSTRAINT "PK_08f1302234d4b46d3560277d829" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_bundle_group"."label_id" IS 'Term holding the multilingual prompt, e.g. "Choose a drink"'; COMMENT ON COLUMN "product_bundle_group"."min_select" IS 'Candidates that must be chosen; 0 makes the group optional'; COMMENT ON COLUMN "product_bundle_group"."max_select" IS 'Candidates that may be chosen; NULL means no upper bound'; COMMENT ON COLUMN "product_bundle_group"."position" IS 'Display order within the bundle'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_group_label_id" ON "product_bundle_group"  ("label_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_group_product_id" ON "product_bundle_group"  ("product_id", "position") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_group_deleted_at" ON "product_bundle_group"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_group" IS 'A choice offered within a bundle; the candidates live in product-bundle-item.entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_category" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "category_id" integer NOT NULL, "details" jsonb, CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_category"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_category_id" ON "product_category"  ("category_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_category_unique" ON "product_category"  ("product_id", "category_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_deleted_at" ON "product_category"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_category" IS 'Links products to categories (multilingual via term)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_content" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "label" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "meta" jsonb, CONSTRAINT "PK_2bf2e348130d697f3ee3aa4e94e" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_content"."meta" IS 'SEO metadata, canonical URL, images, structured data, etc.'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_content_slug_lang" ON "product_content"  ("slug", "language") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_content_unique_per_lang" ON "product_content"  ("product_id", "language") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_content_deleted_at" ON "product_content"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_content" IS 'Language-specific content for products (name, slug, descriptions, meta)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_discount" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "discount_id" integer NOT NULL, CONSTRAINT "PK_8cfd00cd6b9904ee7c5a45ffb3f" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_discount_discount_id" ON "product_discount"  ("discount_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_discount_unique" ON "product_discount"  ("product_id", "discount_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_discount_deleted_at" ON "product_discount"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_discount" IS 'Links products to discounts with \`product\` scope; the window and the rules stay on the discount itself'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_option_group" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "label_id" integer NOT NULL, "min_select" integer NOT NULL DEFAULT '0', "max_select" integer, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "CHK_7e6651f28c44c3e4bc9e11dcbc" CHECK ((max_select IS NULL OR max_select >= min_select)), CONSTRAINT "CHK_1913c423e1e541d0532d2ecf8e" CHECK ((min_select >= 0)), CONSTRAINT "PK_d76e92fdbbb5a2e6752ffd4a2c1" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_option_group"."label_id" IS 'Term holding the multilingual prompt, e.g. "Choose a side"'; COMMENT ON COLUMN "product_option_group"."min_select" IS 'Answers that must be chosen; 0 makes the group optional'; COMMENT ON COLUMN "product_option_group"."max_select" IS 'Answers that may be chosen; NULL means no upper bound'; COMMENT ON COLUMN "product_option_group"."position" IS 'Display order within the product'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_option_group_label_id" ON "product_option_group"  ("label_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_option_group_product_id" ON "product_option_group"  ("product_id", "position") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_option_group_deleted_at" ON "product_option_group"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_option_group" IS 'A choice offered on a product at order time; the answers live in product-option.entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_option_price" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "option_id" integer NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "price_delta" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_6b5e6386450dfecb1edda899d8f" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_option_price"."price_delta" IS 'Added to the variant price; negative subtracts'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_option_price_unique" ON "product_option_price"  ("option_id", "currency") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_option_price_deleted_at" ON "product_option_price"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_option_price" IS 'Per-currency price delta for a product option; excludes VAT, like product-price.entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_option" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "option_group_id" integer NOT NULL, "label_id" integer NOT NULL, "position" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_4cf3c467e9bc764bdd32c4cd938" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_option"."label_id" IS 'Term holding the multilingual answer, e.g. "Extra bacon"'; COMMENT ON COLUMN "product_option"."position" IS 'Display order within the group'; COMMENT ON COLUMN "product_option"."is_default" IS 'Preselected when the customer has not chosen'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_option_default" ON "product_option"  ("option_group_id") WHERE is_default = true AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_option_label_id" ON "product_option"  ("label_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_option_group_id" ON "product_option"  ("option_group_id", "position") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_option_deleted_at" ON "product_option"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_option" IS 'An answer within a product option group; priced as a delta'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_price" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "variant_id" integer NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "price" numeric(12,2) NOT NULL, "rrp" numeric(12,2), "min_price" numeric(12,2), CONSTRAINT "CHK_ad11e792129c9db8f6e1db43fd" CHECK ((min_price IS NULL OR min_price <= price)), CONSTRAINT "CHK_b333e86b299c9a4bfaad60366c" CHECK ((rrp IS NULL OR rrp > 0)), CONSTRAINT "CHK_1c5bad62a27cdf9b84df52383b" CHECK ((price > 0)), CONSTRAINT "PK_039c4320ccd5ede07440f499268" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_price"."price" IS 'The selling price, per \`product.unit\`'; COMMENT ON COLUMN "product_price"."rrp" IS 'Manufacturer''s recommended retail price; display reference only, never charged'; COMMENT ON COLUMN "product_price"."min_price" IS 'Lowest price a discount may resolve to'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_price_unique" ON "product_price"  ("variant_id", "currency") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_price_deleted_at" ON "product_price"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_price" IS 'Per-currency price set for a product variant; every value excludes VAT, matching the contract discounts are applied under'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_workflow_enum" AS ENUM('draft', 'pending_review', 'revision_required', 'ready')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_sale_status_enum" AS ENUM('available', 'coming_soon', 'unavailable', 'discontinued')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_type_enum" AS ENUM('physical', 'digital', 'service')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_composition_enum" AS ENUM('simple', 'bundle')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_unit_enum" AS ENUM('piece', 'kg', 'litre', 'metre', 'hour')`,
		);
		await queryRunner.query(
			`CREATE TABLE "product" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "sku" character varying NOT NULL, "workflow" "public"."product_workflow_enum" NOT NULL DEFAULT 'draft', "sale_status" "public"."product_sale_status_enum" NOT NULL DEFAULT 'available', "type" "public"."product_type_enum" NOT NULL DEFAULT 'physical', "composition" "public"."product_composition_enum" NOT NULL DEFAULT 'simple', "unit" "public"."product_unit_enum" NOT NULL DEFAULT 'piece', "vat_category" character varying(32) NOT NULL DEFAULT 'standard', "available_from" TIMESTAMP, "available_until" TIMESTAMP, "discontinued_at" TIMESTAMP, "details" jsonb, "brand_id" integer, "vendor_id" integer, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id")); COMMENT ON COLUMN "product"."vat_category" IS 'VAT class key; see ProductVatCategoryEnum'; COMMENT ON COLUMN "product"."available_from" IS 'Controls when the product becomes sellable'; COMMENT ON COLUMN "product"."available_until" IS 'Controls when the product stops being sellable'; COMMENT ON COLUMN "product"."discontinued_at" IS 'Set once the product is permanently withdrawn from the catalog'; COMMENT ON COLUMN "product"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_sku" ON "product"  ("sku") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_workflow" ON "product"  ("workflow") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_sale_status" ON "product"  ("sale_status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_type" ON "product"  ("type") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_composition" ON "product"  ("composition") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_brand_id" ON "product"  ("brand_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_vendor_id" ON "product"  ("vendor_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_sale_status_available_until" ON "product"  ("sale_status", "available_until") WHERE available_until IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_sale_status_available_from" ON "product"  ("sale_status", "available_from") WHERE available_from IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_deleted_at" ON "product"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product" IS 'Stores core product information; textual content is saved in a product-content.entity, prices in a product-price.entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_tag" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "tag_id" integer NOT NULL, CONSTRAINT "PK_1439455c6528caa94fcc8564fda" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_tag_tag_id" ON "product_tag"  ("tag_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_tag_unique" ON "product_tag"  ("product_id", "tag_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_tag_deleted_at" ON "product_tag"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_tag" IS 'Links products to tag terms'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_variant_attribute" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "variant_id" integer NOT NULL, "attribute_label_id" integer NOT NULL, "attribute_value_id" integer NOT NULL, CONSTRAINT "PK_90417758096050aa5d9d6e30c0a" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_attribute_label_id" ON "product_variant_attribute"  ("attribute_label_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_attribute_value_id" ON "product_variant_attribute"  ("attribute_value_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_variant_attribute_unique" ON "product_variant_attribute"  ("variant_id", "attribute_label_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_attribute_deleted_at" ON "product_variant_attribute"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_variant_attribute" IS 'The axis values that define a variant, using multilingual terms'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_variant" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "sku" character varying NOT NULL, "barcode" character varying, "position" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "track_stock" boolean NOT NULL DEFAULT false, "low_stock_threshold" integer, "allow_backorder" boolean NOT NULL DEFAULT false, "cost_price" numeric(12,2), CONSTRAINT "CHK_1018e4c3e7cd4b55322df57aee" CHECK ((cost_price IS NULL OR cost_price >= 0)), CONSTRAINT "PK_1ab69c9935c61f7c70791ae0a9f" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_variant"."sku" IS 'The code that is actually sold; \`product.sku\` is the style above it'; COMMENT ON COLUMN "product_variant"."barcode" IS 'External identifier (EAN / UPC / GTIN)'; COMMENT ON COLUMN "product_variant"."position" IS 'Display order within the product'; COMMENT ON COLUMN "product_variant"."is_default" IS 'The variant offered when the customer has not chosen one'; COMMENT ON COLUMN "product_variant"."track_stock" IS 'Whether goods receipts and stock movements apply to it'; COMMENT ON COLUMN "product_variant"."low_stock_threshold" IS 'Quantity at or below which the variant counts as low stock'; COMMENT ON COLUMN "product_variant"."allow_backorder" IS 'Whether it can still be ordered with nothing on hand'; COMMENT ON COLUMN "product_variant"."cost_price" IS 'Weighted average acquisition cost in the base currency; drives margin reporting'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_variant_sku" ON "product_variant"  ("sku") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_variant_barcode" ON "product_variant"  ("barcode") WHERE barcode IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_variant_default" ON "product_variant"  ("product_id") WHERE is_default = true AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_product_id" ON "product_variant"  ("product_id", "position") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_variant_id_product_id" ON "product_variant"  ("id", "product_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_deleted_at" ON "product_variant"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_variant" IS 'The purchasable unit of a product; prices and order lines reference this, not the product'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."subscription_evidence_status_enum" AS ENUM('success', 'failed')`,
		);
		await queryRunner.query(
			`CREATE TABLE "subscription_evidence" ("id" SERIAL NOT NULL, "subscription_id" integer NOT NULL, "invoice_id" integer NOT NULL, "status" "public"."subscription_evidence_status_enum" NOT NULL, "response_data" jsonb, "fail_reason" text, "recorded_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_751c8a105d4627fc564ab7e2fed" PRIMARY KEY ("id")); COMMENT ON COLUMN "subscription_evidence"."response_data" IS 'Response data from the payment gateway. For example: { "transaction_id": "1234567890" }'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_evidence_subscription_id" ON "subscription_evidence"  ("subscription_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_evidence_invoice_id" ON "subscription_evidence"  ("invoice_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_evidence_status" ON "subscription_evidence"  ("status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "subscription_evidence" IS 'Used to track renewal attempts for subscriptions.'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_bundle_item_price" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "item_id" integer NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "price_delta" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_7a3e4166f3ca6678a53698aa79e" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_bundle_item_price"."price_delta" IS 'Added to the bundle price; negative subtracts'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_bundle_item_price_unique" ON "product_bundle_item_price"  ("item_id", "currency") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_item_price_deleted_at" ON "product_bundle_item_price"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item_price" IS 'Per-currency price delta for choosing a bundle component; excludes VAT'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."subscription_status_enum" AS ENUM('active', 'paused', 'canceled', 'expired')`,
		);
		await queryRunner.query(
			`CREATE TABLE "subscription" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" integer NOT NULL, "user_id" integer, "ref_code" character varying NOT NULL, "status" "public"."subscription_status_enum" NOT NULL DEFAULT 'active', "start_at" TIMESTAMP, "end_at" TIMESTAMP, "grace_period" smallint NOT NULL DEFAULT '0', "auto_renew" boolean NOT NULL DEFAULT true, "retry_count" smallint NOT NULL, "retry_interval" smallint NOT NULL, "next_billing_at" TIMESTAMP, "notes" text, "details" jsonb, CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id")); COMMENT ON COLUMN "subscription"."user_id" IS 'When subscription is assigned to a user (virtual services)'; COMMENT ON COLUMN "subscription"."ref_code" IS 'Subscription reference code (e.g., S12345)'; COMMENT ON COLUMN "subscription"."start_at" IS 'When the subscription started'; COMMENT ON COLUMN "subscription"."end_at" IS 'When the subscription ended (if canceled/expired)'; COMMENT ON COLUMN "subscription"."grace_period" IS 'Number of days offered past end at as a grace period to allow renewals'; COMMENT ON COLUMN "subscription"."auto_renew" IS 'Whether the subscription renews automatically'; COMMENT ON COLUMN "subscription"."retry_count" IS 'Max count of renewals attempts before the subscription is marked as expired'; COMMENT ON COLUMN "subscription"."retry_interval" IS 'Number of days between each renewal attempt'; COMMENT ON COLUMN "subscription"."next_billing_at" IS 'Next scheduled billing date'; COMMENT ON COLUMN "subscription"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_subscription_order_id" ON "subscription"  ("order_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_user_id" ON "subscription"  ("user_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_subscription_ref_code" ON "subscription"  ("ref_code") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_status" ON "subscription"  ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_end_at" ON "subscription"  ("end_at", "status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_deleted_at" ON "subscription"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "subscription" IS 'Recurring subscriptions created from orders'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."warehouse_status_enum" AS ENUM('active', 'inactive')`,
		);
		await queryRunner.query(
			`CREATE TABLE "warehouse" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "address_id" integer NOT NULL, "code" character varying(16) NOT NULL, "name" character varying NOT NULL, "status" "public"."warehouse_status_enum" NOT NULL DEFAULT 'active', "is_default" boolean NOT NULL DEFAULT false, "notes" text, CONSTRAINT "PK_965abf9f99ae8c5983ae74ebde8" PRIMARY KEY ("id")); COMMENT ON COLUMN "warehouse"."code" IS 'Short internal identifier, e.g. BUC-01'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_warehouse_address_id" ON "warehouse"  ("address_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_warehouse_code" ON "warehouse"  ("code") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_warehouse_name" ON "warehouse"  ("name") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_warehouse_status" ON "warehouse"  ("status") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_warehouse_default" ON "warehouse"  ("is_default") WHERE is_default = true AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_warehouse_deleted_at" ON "warehouse"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "warehouse" IS 'Locations stock is held in, and the origin goods are shipped from — including for products that are not stock-tracked'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_bundle_item" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "group_id" integer, "variant_id" integer NOT NULL, "quantity" numeric(12,2) NOT NULL DEFAULT '1', "is_default" boolean NOT NULL DEFAULT false, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "CHK_53dcf10353fd7e1a68acc04402" CHECK ((quantity > 0)), CONSTRAINT "PK_8122cf28ef84ed7579411282f52" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_bundle_item"."product_id" IS 'The bundle this component belongs to'; COMMENT ON COLUMN "product_bundle_item"."group_id" IS 'NULL means the component is always included, not a choice'; COMMENT ON COLUMN "product_bundle_item"."variant_id" IS 'The variant consumed when this component is part of the order'; COMMENT ON COLUMN "product_bundle_item"."quantity" IS 'How many of the variant this component contributes'; COMMENT ON COLUMN "product_bundle_item"."is_default" IS 'Preselected within its group; meaningless without one'; COMMENT ON COLUMN "product_bundle_item"."position" IS 'Display order within the group, or within the bundle'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_bundle_item_default" ON "product_bundle_item"  ("group_id") WHERE is_default = true AND group_id IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_item_variant_id" ON "product_bundle_item"  ("variant_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_item_group_id" ON "product_bundle_item"  ("group_id", "position") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_item_product_id" ON "product_bundle_item"  ("product_id", "position") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_item_deleted_at" ON "product_bundle_item"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item" IS 'A component of a bundle; NULL group_id means always included, otherwise a candidate within that group'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_attribute" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "attribute_label_id" integer NOT NULL, "attribute_value_id" integer NOT NULL, CONSTRAINT "PK_f9b91f38df3dbbe481d9e056e5e" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_attribute_label_id" ON "product_attribute"  ("attribute_label_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_attribute_value_id" ON "product_attribute"  ("attribute_value_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_attribute_unique" ON "product_attribute"  ("product_id", "attribute_label_id", "attribute_value_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_deleted_at" ON "product_attribute"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_attribute" IS 'Key/value attributes for products, using multilingual terms'`,
		);
		await queryRunner.query(
			`CREATE TABLE "category_closure" ("id_ancestor" integer NOT NULL, "id_descendant" integer NOT NULL, CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9" PRIMARY KEY ("id_ancestor", "id_descendant"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_4aa1348fc4b7da9bef0fae8ff4" ON "category_closure"  ("id_ancestor") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_6a22002acac4976977b1efd114" ON "category_closure"  ("id_descendant") `,
		);
		await queryRunner.query(
			`ALTER TABLE "address" ADD CONSTRAINT "FK_714a4ca3cfd66a718b5f7c3fee5" FOREIGN KEY ("city_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD CONSTRAINT "FK_6699af3eb85f6ba17010c71167f" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article" ADD CONSTRAINT "FK_16d4ce4c84bd9b8562c6f396262" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "operational_record" ADD CONSTRAINT "FK_55d872f7ba7f7e7692375b1dcf0" FOREIGN KEY ("cash_flow_id") REFERENCES "cash_flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ADD CONSTRAINT "FK_834b8e126ec58955db3a985edfb" FOREIGN KEY ("parent_id") REFERENCES "cash_flow"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" ADD CONSTRAINT "FK_1117b4fcb3cd4abb4383e1c2743" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD CONSTRAINT "FK_c1718000e7e049b9841f8b4b222" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD CONSTRAINT "FK_3871a34c42cb0ceaf17ee65bd6d" FOREIGN KEY ("template_id") REFERENCES "system"."template"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" ADD CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c" FOREIGN KEY ("parent_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_8a4d5521c1ced158c13438df3df" FOREIGN KEY ("permission_id") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_26455b396109a0b535ddb614832" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_cdc3f155737b763c298ab080f84" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" ADD CONSTRAINT "FK_4a239efc040ebec82f2736f490a" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_identity" ADD CONSTRAINT "FK_51838685440a76e0e0495225836" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD CONSTRAINT "FK_ab3c66669facfe429164e60ab82" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "FK_604c2b655029e47091f671ba875" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn" ADD CONSTRAINT "FK_b39d101f21c8bd2c6d4ef7349bf" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn" ADD CONSTRAINT "FK_bb6ef031a4087906372f630ec0b" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn_item" ADD CONSTRAINT "FK_2f3398e4e3b6e493c3900c989b1" FOREIGN KEY ("grn_id") REFERENCES "grn"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn_item" ADD CONSTRAINT "FK_0f7afec9849383ec3e41e0c98c7" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4" FOREIGN KEY ("auth_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse_movement" ADD CONSTRAINT "FK_86a8405bfc8c1087da14dfb6b70" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse_movement" ADD CONSTRAINT "FK_2b2eaee830c2e18b9e088b08c80" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse_movement" ADD CONSTRAINT "FK_3a0efe99501904a3a344758fd76" FOREIGN KEY ("grn_item_id") REFERENCES "grn_item"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse_movement" ADD CONSTRAINT "FK_d3db5c12224d6e37d73e4f458a7" FOREIGN KEY ("reversal_of_id") REFERENCES "warehouse_movement"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_ea143999ecfa6a152f2202895e2" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_94c940b8f640f6e75a9a2a2c18b" FOREIGN KEY ("parent_id") REFERENCES "order_product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_6ce14d73db7519acf7853313720" FOREIGN KEY ("variant_id", "product_id") REFERENCES "product_variant"("id","product_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "FK_a0d9cbb7f4a017bac3198dd8ca0" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD CONSTRAINT "FK_66811564f24eb71ac15e5ea124b" FOREIGN KEY ("order_product_id") REFERENCES "order_product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD CONSTRAINT "FK_08f57f381c1c316fd7bc0d8b3e6" FOREIGN KEY ("order_shipping_id") REFERENCES "order_shipping"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987" FOREIGN KEY ("carrier_id") REFERENCES "carrier"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_f6a6001df2493e4a766f920e24d" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ADD CONSTRAINT "FK_0cb457dbee5bb4cfe9ffb1ce01b" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_group" ADD CONSTRAINT "FK_b27dcfe0bbadcba2a4c9dd236de" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_group" ADD CONSTRAINT "FK_263ebca8a1a834f257faee33318" FOREIGN KEY ("label_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_0374879a971928bc3f57eed0a59" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_2df1f83329c00e6eadde0493e16" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_f768662205b901ba35c9c9255a0" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_discount" ADD CONSTRAINT "FK_87ba7804f51af91e9fb0d84c5dd" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_discount" ADD CONSTRAINT "FK_6080929074c3c5c5a2dbb55af44" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option_group" ADD CONSTRAINT "FK_28f273fec3a8f15a46494a1e5cf" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option_group" ADD CONSTRAINT "FK_cf86995180ef72ced0a9882794b" FOREIGN KEY ("label_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option_price" ADD CONSTRAINT "FK_ad2662418d092bff5d7cd1ee397" FOREIGN KEY ("option_id") REFERENCES "product_option"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option" ADD CONSTRAINT "FK_882a199b6bdc3da9a251729946d" FOREIGN KEY ("option_group_id") REFERENCES "product_option_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option" ADD CONSTRAINT "FK_eba1e720c51c6065fb8a2a6d048" FOREIGN KEY ("label_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" ADD CONSTRAINT "FK_4c512b620f7bb9a8373a2f53f0a" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "FK_0539bfedcb00e1f04dd6d3df10a" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ADD CONSTRAINT "FK_d5dbceb5e426cd9622a029e7678" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ADD CONSTRAINT "FK_cff394fbfce8128dd4ff7d9c7c9" FOREIGN KEY ("attribute_label_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ADD CONSTRAINT "FK_dbfdf59a749dc93e8e04e3b0cfa" FOREIGN KEY ("attribute_value_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" ADD CONSTRAINT "FK_ca67dd080aac5ecf99609960cd2" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" ADD CONSTRAINT "FK_cc9eb4c92df6a79526d30655c1f" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" ADD CONSTRAINT "FK_ce67597df9377e2f93ef86c667a" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item_price" ADD CONSTRAINT "FK_acfab32b10d24fe85d0b91b996c" FOREIGN KEY ("item_id") REFERENCES "product_bundle_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_32ddbd23837b1229248a5cc232b" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_940d49a105d50bbd616be540013" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse" ADD CONSTRAINT "FK_e3166be4143d134babc789bef1c" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" ADD CONSTRAINT "FK_facd66e71c7e4d1de72eead5dee" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" ADD CONSTRAINT "FK_702709f0297263e9fc92c7c1dc2" FOREIGN KEY ("group_id") REFERENCES "product_bundle_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" ADD CONSTRAINT "FK_a5bc9f40d7b103573d5d18f9d93" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c8f119684d209b55cf5e8b42532" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844" FOREIGN KEY ("attribute_label_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d" FOREIGN KEY ("attribute_value_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "FK_4aa1348fc4b7da9bef0fae8ff48" FOREIGN KEY ("id_ancestor") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "FK_6a22002acac4976977b1efd114a" FOREIGN KEY ("id_descendant") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "FK_6a22002acac4976977b1efd114a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "FK_4aa1348fc4b7da9bef0fae8ff48"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c8f119684d209b55cf5e8b42532"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" DROP CONSTRAINT "FK_a5bc9f40d7b103573d5d18f9d93"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" DROP CONSTRAINT "FK_702709f0297263e9fc92c7c1dc2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" DROP CONSTRAINT "FK_facd66e71c7e4d1de72eead5dee"`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse" DROP CONSTRAINT "FK_e3166be4143d134babc789bef1c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_940d49a105d50bbd616be540013"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_32ddbd23837b1229248a5cc232b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item_price" DROP CONSTRAINT "FK_acfab32b10d24fe85d0b91b996c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" DROP CONSTRAINT "FK_ce67597df9377e2f93ef86c667a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" DROP CONSTRAINT "FK_cc9eb4c92df6a79526d30655c1f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" DROP CONSTRAINT "FK_ca67dd080aac5ecf99609960cd2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP CONSTRAINT "FK_dbfdf59a749dc93e8e04e3b0cfa"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP CONSTRAINT "FK_cff394fbfce8128dd4ff7d9c7c9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP CONSTRAINT "FK_d5dbceb5e426cd9622a029e7678"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "FK_0539bfedcb00e1f04dd6d3df10a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" DROP CONSTRAINT "FK_4c512b620f7bb9a8373a2f53f0a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option" DROP CONSTRAINT "FK_eba1e720c51c6065fb8a2a6d048"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option" DROP CONSTRAINT "FK_882a199b6bdc3da9a251729946d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option_price" DROP CONSTRAINT "FK_ad2662418d092bff5d7cd1ee397"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option_group" DROP CONSTRAINT "FK_cf86995180ef72ced0a9882794b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_option_group" DROP CONSTRAINT "FK_28f273fec3a8f15a46494a1e5cf"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_discount" DROP CONSTRAINT "FK_6080929074c3c5c5a2dbb55af44"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_discount" DROP CONSTRAINT "FK_87ba7804f51af91e9fb0d84c5dd"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_f768662205b901ba35c9c9255a0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_2df1f83329c00e6eadde0493e16"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_0374879a971928bc3f57eed0a59"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_group" DROP CONSTRAINT "FK_263ebca8a1a834f257faee33318"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_group" DROP CONSTRAINT "FK_b27dcfe0bbadcba2a4c9dd236de"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" DROP CONSTRAINT "FK_0cb457dbee5bb4cfe9ffb1ce01b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_f6a6001df2493e4a766f920e24d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "FK_08f57f381c1c316fd7bc0d8b3e6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "FK_66811564f24eb71ac15e5ea124b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "FK_a0d9cbb7f4a017bac3198dd8ca0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_6ce14d73db7519acf7853313720"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_94c940b8f640f6e75a9a2a2c18b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_ea143999ecfa6a152f2202895e2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse_movement" DROP CONSTRAINT "FK_d3db5c12224d6e37d73e4f458a7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse_movement" DROP CONSTRAINT "FK_3a0efe99501904a3a344758fd76"`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse_movement" DROP CONSTRAINT "FK_2b2eaee830c2e18b9e088b08c80"`,
		);
		await queryRunner.query(
			`ALTER TABLE "warehouse_movement" DROP CONSTRAINT "FK_86a8405bfc8c1087da14dfb6b70"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4"`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn_item" DROP CONSTRAINT "FK_0f7afec9849383ec3e41e0c98c7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn_item" DROP CONSTRAINT "FK_2f3398e4e3b6e493c3900c989b1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" DROP CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd"`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn" DROP CONSTRAINT "FK_bb6ef031a4087906372f630ec0b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn" DROP CONSTRAINT "FK_b39d101f21c8bd2c6d4ef7349bf"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "FK_604c2b655029e47091f671ba875"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP CONSTRAINT "FK_ab3c66669facfe429164e60ab82"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_identity" DROP CONSTRAINT "FK_51838685440a76e0e0495225836"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" DROP CONSTRAINT "FK_4a239efc040ebec82f2736f490a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_cdc3f155737b763c298ab080f84"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_26455b396109a0b535ddb614832"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_8a4d5521c1ced158c13438df3df"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" DROP CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP CONSTRAINT "FK_3871a34c42cb0ceaf17ee65bd6d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP CONSTRAINT "FK_c1718000e7e049b9841f8b4b222"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" DROP CONSTRAINT "FK_1117b4fcb3cd4abb4383e1c2743"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" DROP CONSTRAINT "FK_834b8e126ec58955db3a985edfb"`,
		);
		await queryRunner.query(
			`ALTER TABLE "operational_record" DROP CONSTRAINT "FK_55d872f7ba7f7e7692375b1dcf0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article" DROP CONSTRAINT "FK_16d4ce4c84bd9b8562c6f396262"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" DROP CONSTRAINT "FK_6699af3eb85f6ba17010c71167f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "address" DROP CONSTRAINT "FK_714a4ca3cfd66a718b5f7c3fee5"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_6a22002acac4976977b1efd114"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_4aa1348fc4b7da9bef0fae8ff4"`,
		);
		await queryRunner.query(`DROP TABLE "category_closure"`);
		await queryRunner.query(`COMMENT ON TABLE "product_attribute" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_attribute_value_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_attribute_label_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_attribute"`);
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_group_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_variant_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_default"`,
		);
		await queryRunner.query(`DROP TABLE "product_bundle_item"`);
		await queryRunner.query(`COMMENT ON TABLE "warehouse" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_warehouse_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_warehouse_default"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_warehouse_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_warehouse_name"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_warehouse_code"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_warehouse_address_id"`,
		);
		await queryRunner.query(`DROP TABLE "warehouse"`);
		await queryRunner.query(`DROP TYPE "public"."warehouse_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "subscription" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_end_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_ref_code"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_user_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_order_id"`,
		);
		await queryRunner.query(`DROP TABLE "subscription"`);
		await queryRunner.query(
			`DROP TYPE "public"."subscription_status_enum"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item_price" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_price_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_price_unique"`,
		);
		await queryRunner.query(`DROP TABLE "product_bundle_item_price"`);
		await queryRunner.query(
			`COMMENT ON TABLE "subscription_evidence" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_evidence_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_evidence_invoice_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_evidence_subscription_id"`,
		);
		await queryRunner.query(`DROP TABLE "subscription_evidence"`);
		await queryRunner.query(
			`DROP TYPE "public"."subscription_evidence_status_enum"`,
		);
		await queryRunner.query(`COMMENT ON TABLE "product_variant" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_id_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_default"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_barcode"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_sku"`,
		);
		await queryRunner.query(`DROP TABLE "product_variant"`);
		await queryRunner.query(
			`COMMENT ON TABLE "product_variant_attribute" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_attribute_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_attribute_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_attribute_value_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_attribute_label_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_variant_attribute"`);
		await queryRunner.query(`COMMENT ON TABLE "product_tag" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_tag_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_tag_id"`);
		await queryRunner.query(`DROP TABLE "product_tag"`);
		await queryRunner.query(`COMMENT ON TABLE "product" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_deleted_at"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_sale_status_available_from"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_sale_status_available_until"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_vendor_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_brand_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_composition"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_type"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_sale_status"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_workflow"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_sku"`);
		await queryRunner.query(`DROP TABLE "product"`);
		await queryRunner.query(`DROP TYPE "public"."product_unit_enum"`);
		await queryRunner.query(
			`DROP TYPE "public"."product_composition_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."product_type_enum"`);
		await queryRunner.query(
			`DROP TYPE "public"."product_sale_status_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."product_workflow_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "product_price" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_price_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_price_unique"`,
		);
		await queryRunner.query(`DROP TABLE "product_price"`);
		await queryRunner.query(`COMMENT ON TABLE "product_option" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_group_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_label_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_default"`,
		);
		await queryRunner.query(`DROP TABLE "product_option"`);
		await queryRunner.query(
			`COMMENT ON TABLE "product_option_price" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_price_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_price_unique"`,
		);
		await queryRunner.query(`DROP TABLE "product_option_price"`);
		await queryRunner.query(
			`COMMENT ON TABLE "product_option_group" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_group_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_group_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_group_label_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_option_group"`);
		await queryRunner.query(`COMMENT ON TABLE "product_discount" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_discount_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_discount_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_discount_discount_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_discount"`);
		await queryRunner.query(`COMMENT ON TABLE "product_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_slug_lang"`,
		);
		await queryRunner.query(`DROP TABLE "product_content"`);
		await queryRunner.query(`COMMENT ON TABLE "product_category" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_category_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_category"`);
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_group" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_group_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_group_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_group_label_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_bundle_group"`);
		await queryRunner.query(
			`COMMENT ON TABLE "product_availability" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_availability_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_availability_product_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_availability"`);
		await queryRunner.query(`COMMENT ON TABLE "order_shipping" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_tracking_number"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_warehouse_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_carrier_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_method"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_order_id"`,
		);
		await queryRunner.query(`DROP TABLE "order_shipping"`);
		await queryRunner.query(
			`DROP TYPE "public"."order_shipping_status_enum"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order_shipping_product" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_product_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_product_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_product_order_product_id"`,
		);
		await queryRunner.query(`DROP TABLE "order_shipping_product"`);
		await queryRunner.query(`COMMENT ON TABLE "order" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_ref"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_issued_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_client_id"`);
		await queryRunner.query(`DROP TABLE "order"`);
		await queryRunner.query(`DROP TYPE "public"."order_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "order_product" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_variant_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_parent_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_order_id"`,
		);
		await queryRunner.query(`DROP TABLE "order_product"`);
		await queryRunner.query(
			`COMMENT ON TABLE "warehouse_movement" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_warehouse_movement_variant"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_warehouse_movement_grn_item_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_warehouse_movement_source"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_warehouse_movement_reversal_of_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_warehouse_movement_type"`,
		);
		await queryRunner.query(`DROP TABLE "warehouse_movement"`);
		await queryRunner.query(
			`DROP TYPE "public"."warehouse_movement_source_type_enum"`,
		);
		await queryRunner.query(
			`DROP TYPE "public"."warehouse_movement_movement_type_enum"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "logs"."log_history" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_entity_id_action"`,
		);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_recorded_at"`,
		);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_history_source"`);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_request_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_performed_by"`,
		);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_history_auth_id"`);
		await queryRunner.query(`DROP TABLE "logs"."log_history"`);
		await queryRunner.query(`COMMENT ON TABLE "grn_item" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_grn_item_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_grn_item_unique"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_grn_item_variant_open"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_grn_item_variant_id"`,
		);
		await queryRunner.query(`DROP TABLE "grn_item"`);
		await queryRunner.query(`COMMENT ON TABLE "invoice" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_ref"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_type"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_order_id"`);
		await queryRunner.query(`DROP TABLE "invoice"`);
		await queryRunner.query(`DROP TYPE "public"."invoice_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."invoice_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "grn" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_grn_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_grn_ref"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_grn_warehouse_status_received_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_grn_vendor_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_grn_warehouse_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_grn_supplier_document_number"`,
		);
		await queryRunner.query(`DROP TABLE "grn"`);
		await queryRunner.query(`DROP TYPE "public"."grn_status_enum"`);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_recovery" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_recovery_ident"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_recovery_user_id"`,
		);
		await queryRunner.query(`DROP TABLE "system"."account_recovery"`);
		await queryRunner.query(
			`COMMENT ON TABLE "logs"."cron_history" IS NULL`,
		);
		await queryRunner.query(`DROP INDEX "logs"."IDX_cron_history_status"`);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_cron_history_start_at"`,
		);
		await queryRunner.query(`DROP TABLE "logs"."cron_history"`);
		await queryRunner.query(`DROP TYPE "logs"."cron_history_status_enum"`);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_token" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_token_ident"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_token_user_id"`,
		);
		await queryRunner.query(`DROP TABLE "system"."account_token"`);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_identity" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_identity_provider_subject"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_identity_user_provider"`,
		);
		await queryRunner.query(`DROP TABLE "system"."account_identity"`);
		await queryRunner.query(
			`DROP TYPE "system"."account_identity_provider_enum"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_visibility_rule" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_visibility_rule_deleted_at"`,
		);
		await queryRunner.query(`DROP TABLE "article_visibility_rule"`);
		await queryRunner.query(`COMMENT ON TABLE "article_tag" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_tag_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_tag_id"`);
		await queryRunner.query(`DROP TABLE "article_tag"`);
		await queryRunner.query(`COMMENT ON TABLE "article_category" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_category_id"`,
		);
		await queryRunner.query(`DROP TABLE "article_category"`);
		await queryRunner.query(`COMMENT ON TABLE "term" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_language"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_type"`);
		await queryRunner.query(`DROP TABLE "term"`);
		await queryRunner.query(`DROP TYPE "public"."term_type_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "user_permission" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_user_permission_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_user_permission_permission"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_user_permission_permission_id"`,
		);
		await queryRunner.query(`DROP TABLE "user_permission"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_user_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_user_email"`);
		await queryRunner.query(`DROP TABLE "user"`);
		await queryRunner.query(`DROP TYPE "public"."user_operator_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
		await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "vendor" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_type"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_name"`);
		await queryRunner.query(`DROP TABLE "vendor"`);
		await queryRunner.query(`DROP TYPE "public"."vendor_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."vendor_type_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "category_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_content_category_id_language"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_content_slug_language"`,
		);
		await queryRunner.query(`DROP TABLE "category_content"`);
		await queryRunner.query(
			`DROP TYPE "public"."category_content_type_enum"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_brand_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_brand_slug"`);
		await queryRunner.query(`DROP TABLE "brand"`);
		await queryRunner.query(`DROP TYPE "public"."brand_brand_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."brand_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "place" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_code"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_parent_id"`);
		await queryRunner.query(`DROP TABLE "place"`);
		await queryRunner.query(`DROP TYPE "public"."place_place_type_enum"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_type_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_storage"`);
		await queryRunner.query(`DROP TABLE "image"`);
		await queryRunner.query(`DROP TYPE "public"."image_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."image_storage_enum"`);
		await queryRunner.query(`DROP TYPE "public"."image_image_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."image_section_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "place_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "place_content"`);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_data"`);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_data_request_id"`);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_data_pid"`);
		await queryRunner.query(`DROP TABLE "logs"."log_data"`);
		await queryRunner.query(`DROP TYPE "logs"."log_data_level_enum"`);
		await queryRunner.query(`DROP TYPE "logs"."log_data_category_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "system"."template" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_template_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_label_language_type"`,
		);
		await queryRunner.query(`DROP TABLE "system"."template"`);
		await queryRunner.query(`DROP TYPE "system"."template_type_enum"`);
		await queryRunner.query(`DROP INDEX "system"."IDX_mail_queue_sent_at"`);
		await queryRunner.query(`DROP INDEX "system"."IDX_mail_queue_status"`);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_mail_queue_template_id"`,
		);
		await queryRunner.query(`DROP TABLE "system"."mail_queue"`);
		await queryRunner.query(`DROP TYPE "system"."mail_queue_status_enum"`);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."permission" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_permission_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "system"."IDX_permission"`);
		await queryRunner.query(`DROP TABLE "system"."permission"`);
		await queryRunner.query(`COMMENT ON TABLE "image_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_image_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "image_content"`);
		await queryRunner.query(`COMMENT ON TABLE "discount" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_discount_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_active"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_reference"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_reason"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_scope"`);
		await queryRunner.query(`DROP TABLE "discount"`);
		await queryRunner.query(`DROP TYPE "public"."discount_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."discount_reason_enum"`);
		await queryRunner.query(`DROP TYPE "public"."discount_scope_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "client" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_client_deleted_at"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_client_company_name_unique"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_client_cui_unique"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_client_reg_com_unique"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_client_cnp_unique"`);
		await queryRunner.query(`DROP TABLE "client"`);
		await queryRunner.query(`DROP TYPE "public"."client_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."client_client_type_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "category" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_category_type"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_category_parent_id"`);
		await queryRunner.query(`DROP TABLE "category"`);
		await queryRunner.query(`DROP TYPE "public"."category_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."category_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "cash_flow" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_created_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_category_created_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_method_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_status_created_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_parent_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_external_reference"`,
		);
		await queryRunner.query(`DROP TABLE "cash_flow"`);
		await queryRunner.query(`DROP TYPE "public"."cash_flow_currency_enum"`);
		await queryRunner.query(`DROP TYPE "public"."cash_flow_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."cash_flow_method_enum"`);
		await queryRunner.query(`DROP TYPE "public"."cash_flow_category_enum"`);
		await queryRunner.query(
			`DROP TYPE "public"."cash_flow_category_type_enum"`,
		);
		await queryRunner.query(
			`DROP TYPE "public"."cash_flow_direction_enum"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "operational_record" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_operational_record_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_operational_record_cash_flow_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_operational_record_entity_id"`,
		);
		await queryRunner.query(`DROP TABLE "operational_record"`);
		await queryRunner.query(
			`DROP TYPE "public"."operational_record_operational_record_type_enum"`,
		);
		await queryRunner.query(`COMMENT ON TABLE "carrier" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_carrier_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_carrier_name"`);
		await queryRunner.query(`DROP TABLE "carrier"`);
		await queryRunner.query(`COMMENT ON TABLE "article" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_deleted_at"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_status_publish_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_featured"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_archive_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_public_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_author_id"`);
		await queryRunner.query(`DROP TABLE "article"`);
		await queryRunner.query(
			`DROP TYPE "public"."article_source_mode_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."article_visibility_enum"`);
		await queryRunner.query(
			`DROP TYPE "public"."article_featured_status_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."article_layout_enum"`);
		await queryRunner.query(`DROP TYPE "public"."article_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "brand_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_brand_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_brand_content_deleted_at"`,
		);
		await queryRunner.query(`DROP TABLE "brand_content"`);
		await queryRunner.query(`COMMENT ON TABLE "article_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(`DROP TABLE "article_content"`);
		await queryRunner.query(`COMMENT ON TABLE "address" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_address_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_address_city_id"`);
		await queryRunner.query(`DROP TABLE "address"`);
	}
}
