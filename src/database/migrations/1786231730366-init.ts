import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1786231730366 implements MigrationInterface {
	name = 'Init1786231730366';

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
			`CREATE TABLE "image_content" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "image_id" integer NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "title" text, "description" text, CONSTRAINT "PK_7f5b75103fb93c4bc1c1fd46496" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_image_content_unique_per_lang" ON "image_content"  ("image_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "image_content" IS 'Language-specific content for images'`,
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
			`CREATE TYPE "public"."vendor_status_enum" AS ENUM('active', 'inactive', 'pending')`,
		);
		await queryRunner.query(
			`CREATE TABLE "vendor" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "status" "public"."vendor_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_931a23f6231a57604f5a0e32780" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_name" ON "vendor"  ("name") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_status" ON "vendor"  ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_deleted_at" ON "vendor"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(`COMMENT ON TABLE "vendor" IS 'Store vendors'`);
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
			`CREATE TYPE "public"."invoice_status_enum" AS ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded')`,
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
			`CREATE TABLE "order_product" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" numeric(12,2) NOT NULL, "vat_rate" numeric(5,2) NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "discount" jsonb, "notes" text, CONSTRAINT "PK_539ede39e518562dfdadfddb492" PRIMARY KEY ("id")); COMMENT ON COLUMN "order_product"."currency" IS 'Currency is specific to client'; COMMENT ON COLUMN "order_product"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = same currency)'; COMMENT ON COLUMN "order_product"."discount" IS 'Array of discount snapshots applied'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_order_id" ON "order_product"  ("order_id") `,
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
			`CREATE TABLE "article_visibility_rule" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "article_id" integer NOT NULL, "requires_auth" boolean NOT NULL DEFAULT false, "requires_subscription" character varying array, "allowed_countries" character varying(2) array, "password" character varying, "is_listed" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_4a239efc040ebec82f2736f490" UNIQUE ("article_id"), CONSTRAINT "PK_f14deeb133759688c6364b51a08" PRIMARY KEY ("id")); COMMENT ON COLUMN "article_visibility_rule"."requires_auth" IS 'Only logged-in users can view the article'; COMMENT ON COLUMN "article_visibility_rule"."requires_subscription" IS 'Subscription plan identifiers granting access; null means subscription is not required'; COMMENT ON COLUMN "article_visibility_rule"."allowed_countries" IS 'ISO 3166-1 alpha-2 codes allowed to view; null means no country restriction'; COMMENT ON COLUMN "article_visibility_rule"."password" IS 'Hashed password required to view the article'; COMMENT ON COLUMN "article_visibility_rule"."is_listed" IS 'Whether the article is listed in indexes, feeds and search'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_visibility_rule_deleted_at" ON "article_visibility_rule"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_visibility_rule" IS 'Visibility rules for articles with restricted visibility'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."order_status_enum" AS ENUM('draft', 'pending', 'confirmed', 'completed', 'cancelled')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."order_type_enum" AS ENUM('standard', 'subscription')`,
		);
		await queryRunner.query(
			`CREATE TABLE "order" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "client_id" integer NOT NULL, "ref_number" character varying NOT NULL, "status" "public"."order_status_enum" NOT NULL DEFAULT 'draft', "type" "public"."order_type_enum" NOT NULL DEFAULT 'standard', "issued_at" TIMESTAMP NOT NULL, "notes" text, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_client_id" ON "order"  ("client_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_order_ref_number" ON "order"  ("ref_number") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_status" ON "order"  ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_issued_at" ON "order"  ("issued_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_deleted_at" ON "order"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order" IS 'Stores order information'`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_shipping_product" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_product_id" integer NOT NULL, "order_shipping_id" integer NOT NULL, "quantity" numeric(12,2) NOT NULL, "notes" text, CONSTRAINT "PK_07c1c05392d97859bb43947dfc7" PRIMARY KEY ("id"))`,
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
			`CREATE TABLE "product_attribute" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "attribute_label_id" integer NOT NULL, "attribute_value_id" integer NOT NULL, CONSTRAINT "PK_f9b91f38df3dbbe481d9e056e5e" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_product_id" ON "product_attribute"  ("product_id") `,
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
			`CREATE TYPE "public"."order_shipping_status_enum" AS ENUM('pending', 'preparing', 'shipped', 'delivered', 'failed', 'returned')`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_shipping" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" integer NOT NULL, "status" "public"."order_shipping_status_enum" NOT NULL DEFAULT 'pending', "method" character varying, "carrier_id" integer, "tracking_number" character varying, "tracking_url" character varying, "vat_rate" numeric(5,2) NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "discount" jsonb, "contact_name" character varying, "contact_phone" character varying, "contact_email" character varying, "address_country" character varying, "address_region" character varying, "address_city" character varying, "details" character varying, "postal_code" character varying, "shipped_at" TIMESTAMP, "delivered_at" TIMESTAMP, "estimated_delivery_at" TIMESTAMP, "notes" text, CONSTRAINT "PK_9e1174bf865646026aba95d2ae0" PRIMARY KEY ("id")); COMMENT ON COLUMN "order_shipping"."method" IS 'eg: courier, pickup, same-day, own-fleet, etc'; COMMENT ON COLUMN "order_shipping"."currency" IS 'Currency is specific to client'; COMMENT ON COLUMN "order_shipping"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = same currency)'; COMMENT ON COLUMN "order_shipping"."discount" IS 'Array of discount snapshots applied'`,
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
			`CREATE UNIQUE INDEX "IDX_order_shipping_tracking_number" ON "order_shipping"  ("tracking_number") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_deleted_at" ON "order_shipping"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order_shipping" IS 'Stores shipping details for orders'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_workflow_enum" AS ENUM('draft', 'pending_review', 'revision_required', 'ready')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_sale_status_enum" AS ENUM('on_sale', 'coming_soon', 'seasonal', 'discontinued', 'archived')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_type_enum" AS ENUM('physical', 'digital', 'service')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_stock_status_enum" AS ENUM('low_stock', 'out_of_stock')`,
		);
		await queryRunner.query(
			`CREATE TABLE "product" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "sku" character varying NOT NULL, "brand_id" integer NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "vat_rate" numeric(5,2) NOT NULL DEFAULT '0', "workflow" "public"."product_workflow_enum" NOT NULL DEFAULT 'draft', "sale_status" "public"."product_sale_status_enum" NOT NULL DEFAULT 'on_sale', "type" "public"."product_type_enum" NOT NULL DEFAULT 'physical', "stock_status" "public"."product_stock_status_enum", "stock_qty" integer NOT NULL DEFAULT '0', "stock_updated_at" TIMESTAMP NOT NULL, "details" jsonb, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id")); COMMENT ON COLUMN "product"."price" IS 'Default price if not specified otherwise'; COMMENT ON COLUMN "product"."currency" IS 'Default currency for price if not specified otherwise'; COMMENT ON COLUMN "product"."vat_rate" IS 'Default VAT rate if not specified otherwise'; COMMENT ON COLUMN "product"."stock_status" IS 'Stock status; updated via cron job'; COMMENT ON COLUMN "product"."stock_qty" IS 'Available stock quantity - this is just a snapshot not the real value'; COMMENT ON COLUMN "product"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_sku" ON "product"  ("sku") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_brand_id" ON "product"  ("brand_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_workflow" ON "product"  ("workflow") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_sale_status" ON "product"  ("sale_status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_deleted_at" ON "product"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product" IS 'Stores core product information; textual content is saved in a product-content.entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_tag" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "tag_id" integer NOT NULL, "details" jsonb, CONSTRAINT "PK_1439455c6528caa94fcc8564fda" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_tag"."details" IS 'Reserved column for future use'`,
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
			`CREATE TYPE "public"."subscription_status_enum" AS ENUM('active', 'paused', 'cancelled', 'expired')`,
		);
		await queryRunner.query(
			`CREATE TABLE "subscription" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" integer NOT NULL, "user_id" integer, "ref_code" character varying NOT NULL, "status" "public"."subscription_status_enum" NOT NULL DEFAULT 'active', "start_at" TIMESTAMP, "end_at" TIMESTAMP, "grace_period" smallint NOT NULL DEFAULT '0', "auto_renew" boolean NOT NULL DEFAULT true, "retry_count" smallint NOT NULL, "retry_interval" smallint NOT NULL, "next_billing_at" TIMESTAMP, "notes" text, "details" jsonb, CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id")); COMMENT ON COLUMN "subscription"."user_id" IS 'When subscription is assigned to a user (virtual services)'; COMMENT ON COLUMN "subscription"."ref_code" IS 'Subscription reference code (e.g., S12345)'; COMMENT ON COLUMN "subscription"."start_at" IS 'When the subscription started'; COMMENT ON COLUMN "subscription"."end_at" IS 'When the subscription ended (if cancelled/expired)'; COMMENT ON COLUMN "subscription"."grace_period" IS 'Number of days offered past end at as a grace period to allow renewals'; COMMENT ON COLUMN "subscription"."auto_renew" IS 'Whether the subscription renews automatically'; COMMENT ON COLUMN "subscription"."retry_count" IS 'Max count of renewals attempts before the subscription is marked as expired'; COMMENT ON COLUMN "subscription"."retry_interval" IS 'Number of days between each renewal attempt'; COMMENT ON COLUMN "subscription"."next_billing_at" IS 'Next scheduled billing date'; COMMENT ON COLUMN "subscription"."details" IS 'Reserved column for future use'`,
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
			`ALTER TABLE "category" ADD CONSTRAINT "FK_1117b4fcb3cd4abb4383e1c2743" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD CONSTRAINT "FK_6699af3eb85f6ba17010c71167f" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "operational_record" ADD CONSTRAINT "FK_55d872f7ba7f7e7692375b1dcf0" FOREIGN KEY ("cash_flow_id") REFERENCES "cash_flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ADD CONSTRAINT "FK_834b8e126ec58955db3a985edfb" FOREIGN KEY ("parent_id") REFERENCES "cash_flow"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD CONSTRAINT "FK_c1718000e7e049b9841f8b4b222" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD CONSTRAINT "FK_3871a34c42cb0ceaf17ee65bd6d" FOREIGN KEY ("template_id") REFERENCES "system"."template"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_8a4d5521c1ced158c13438df3df" FOREIGN KEY ("permission_id") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" ADD CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c" FOREIGN KEY ("parent_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_identity" ADD CONSTRAINT "FK_51838685440a76e0e0495225836" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD CONSTRAINT "FK_ab3c66669facfe429164e60ab82" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "FK_604c2b655029e47091f671ba875" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_26455b396109a0b535ddb614832" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_cdc3f155737b763c298ab080f84" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article" ADD CONSTRAINT "FK_16d4ce4c84bd9b8562c6f396262" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_ea143999ecfa6a152f2202895e2" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_400f1584bf37c21172da3b15e2d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4" FOREIGN KEY ("auth_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" ADD CONSTRAINT "FK_4a239efc040ebec82f2736f490a" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c8f119684d209b55cf5e8b42532" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844" FOREIGN KEY ("attribute_label_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d" FOREIGN KEY ("attribute_value_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987" FOREIGN KEY ("carrier_id") REFERENCES "carrier"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" ADD CONSTRAINT "FK_cc9eb4c92df6a79526d30655c1f" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" ADD CONSTRAINT "FK_ce67597df9377e2f93ef86c667a" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_32ddbd23837b1229248a5cc232b" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_940d49a105d50bbd616be540013" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_f768662205b901ba35c9c9255a0" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_0374879a971928bc3f57eed0a59" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_2df1f83329c00e6eadde0493e16" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_2df1f83329c00e6eadde0493e16"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_0374879a971928bc3f57eed0a59"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_f768662205b901ba35c9c9255a0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_940d49a105d50bbd616be540013"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_32ddbd23837b1229248a5cc232b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" DROP CONSTRAINT "FK_ce67597df9377e2f93ef86c667a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" DROP CONSTRAINT "FK_cc9eb4c92df6a79526d30655c1f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99"`,
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
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "FK_08f57f381c1c316fd7bc0d8b3e6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "FK_66811564f24eb71ac15e5ea124b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "FK_a0d9cbb7f4a017bac3198dd8ca0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" DROP CONSTRAINT "FK_4a239efc040ebec82f2736f490a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_400f1584bf37c21172da3b15e2d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_ea143999ecfa6a152f2202895e2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" DROP CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article" DROP CONSTRAINT "FK_16d4ce4c84bd9b8562c6f396262"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_cdc3f155737b763c298ab080f84"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_26455b396109a0b535ddb614832"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "FK_604c2b655029e47091f671ba875"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP CONSTRAINT "FK_ab3c66669facfe429164e60ab82"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_identity" DROP CONSTRAINT "FK_51838685440a76e0e0495225836"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" DROP CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_8a4d5521c1ced158c13438df3df"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP CONSTRAINT "FK_3871a34c42cb0ceaf17ee65bd6d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP CONSTRAINT "FK_c1718000e7e049b9841f8b4b222"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" DROP CONSTRAINT "FK_834b8e126ec58955db3a985edfb"`,
		);
		await queryRunner.query(
			`ALTER TABLE "operational_record" DROP CONSTRAINT "FK_55d872f7ba7f7e7692375b1dcf0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" DROP CONSTRAINT "FK_6699af3eb85f6ba17010c71167f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" DROP CONSTRAINT "FK_1117b4fcb3cd4abb4383e1c2743"`,
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
			`DROP INDEX "public"."IDX_product_sale_status"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_workflow"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_brand_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_sku"`);
		await queryRunner.query(`DROP TABLE "product"`);
		await queryRunner.query(
			`DROP TYPE "public"."product_stock_status_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."product_type_enum"`);
		await queryRunner.query(
			`DROP TYPE "public"."product_sale_status_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."product_workflow_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "order_shipping" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_tracking_number"`,
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
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_product_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_attribute"`);
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
		await queryRunner.query(`DROP INDEX "public"."IDX_order_issued_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_ref_number"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_client_id"`);
		await queryRunner.query(`DROP TABLE "order"`);
		await queryRunner.query(`DROP TYPE "public"."order_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
		await queryRunner.query(
			`COMMENT ON TABLE "article_visibility_rule" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_visibility_rule_deleted_at"`,
		);
		await queryRunner.query(`DROP TABLE "article_visibility_rule"`);
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
		await queryRunner.query(`COMMENT ON TABLE "order_product" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_order_id"`,
		);
		await queryRunner.query(`DROP TABLE "order_product"`);
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
		await queryRunner.query(`COMMENT ON TABLE "invoice" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_ref"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_type"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_order_id"`);
		await queryRunner.query(`DROP TABLE "invoice"`);
		await queryRunner.query(`DROP TYPE "public"."invoice_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."invoice_status_enum"`);
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
		await queryRunner.query(
			`COMMENT ON TABLE "logs"."cron_history" IS NULL`,
		);
		await queryRunner.query(`DROP INDEX "logs"."IDX_cron_history_status"`);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_cron_history_start_at"`,
		);
		await queryRunner.query(`DROP TABLE "logs"."cron_history"`);
		await queryRunner.query(`DROP TYPE "logs"."cron_history_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "article_tag" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_tag_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_tag_id"`);
		await queryRunner.query(`DROP TABLE "article_tag"`);
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
		await queryRunner.query(`COMMENT ON TABLE "term" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_language"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_type"`);
		await queryRunner.query(`DROP TABLE "term"`);
		await queryRunner.query(`DROP TYPE "public"."term_type_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "place" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_code"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_parent_id"`);
		await queryRunner.query(`DROP TABLE "place"`);
		await queryRunner.query(`DROP TYPE "public"."place_place_type_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "vendor" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_name"`);
		await queryRunner.query(`DROP TABLE "vendor"`);
		await queryRunner.query(`DROP TYPE "public"."vendor_status_enum"`);
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
		await queryRunner.query(`COMMENT ON TABLE "place_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "place_content"`);
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
		await queryRunner.query(
			`COMMENT ON TABLE "system"."permission" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_permission_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "system"."IDX_permission"`);
		await queryRunner.query(`DROP TABLE "system"."permission"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_type_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_storage"`);
		await queryRunner.query(`DROP TABLE "image"`);
		await queryRunner.query(`DROP TYPE "public"."image_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."image_storage_enum"`);
		await queryRunner.query(`DROP TYPE "public"."image_image_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."image_section_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "image_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_image_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "image_content"`);
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
		await queryRunner.query(`COMMENT ON TABLE "brand_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_brand_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_brand_content_deleted_at"`,
		);
		await queryRunner.query(`DROP TABLE "brand_content"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_brand_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_brand_slug"`);
		await queryRunner.query(`DROP TABLE "brand"`);
		await queryRunner.query(`DROP TYPE "public"."brand_brand_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."brand_status_enum"`);
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
		await queryRunner.query(`COMMENT ON TABLE "category" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_category_type"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_category_parent_id"`);
		await queryRunner.query(`DROP TABLE "category"`);
		await queryRunner.query(`DROP TYPE "public"."category_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."category_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "carrier" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_carrier_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_carrier_name"`);
		await queryRunner.query(`DROP TABLE "carrier"`);
		await queryRunner.query(`COMMENT ON TABLE "address" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_address_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_address_city_id"`);
		await queryRunner.query(`DROP TABLE "address"`);
	}
}
