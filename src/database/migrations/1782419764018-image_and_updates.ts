import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ImageAndUpdates1782419764018 implements MigrationInterface {
	name = 'ImageAndUpdates1782419764018';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_image_unique_main"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_type_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_gateway_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_gateway_transaction_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_track_article_id_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_content" IS 'Track article views, etc.'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."vendor_status_enum" AS ENUM('active', 'inactive', 'pending')`,
		);
		await queryRunner.query(
			`CREATE TABLE "vendor" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "status" "public"."vendor_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_931a23f6231a57604f5a0e32780" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_name" ON "vendor" ("name") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_status" ON "vendor" ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_vendor_deleted_at" ON "vendor" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(`COMMENT ON TABLE "vendor" IS 'Store vendors'`);
		await queryRunner.query(
			`CREATE TYPE "public"."operational_record_operational_record_type_enum" AS ENUM('client', 'vendor')`,
		);
		await queryRunner.query(
			`CREATE TABLE "operational_record" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "cash_flow_id" integer NOT NULL, "operational_record_type" "public"."operational_record_operational_record_type_enum" NOT NULL, "entity_id" integer NOT NULL, "notes" text, CONSTRAINT "PK_5455e9f4362fb1f5c3385a42a19" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_operational_record_entity_id" ON "operational_record" ("entity_id", "operational_record_type") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_operational_record_cash_flow_id" ON "operational_record" ("cash_flow_id", "operational_record_type") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "operational_record" IS 'Store operational records linked with cash flow operations.'`,
		);
		await queryRunner.query(
			`CREATE TABLE "address" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "city_id" integer, "details" text NOT NULL, "postal_code" character varying, CONSTRAINT "PK_d92de1f82754668b5f5f5dd4fd5" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_address_deleted_at" ON "address" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(`COMMENT ON TABLE "address" IS 'Addresses'`);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP COLUMN "fileProps"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP COLUMN "elementAttrs"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image" DROP COLUMN "entity_type"`,
		);
		await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "kind"`);
		await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "is_main"`);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "views"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`,
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
			`ALTER TABLE "image_content" ADD "storage" text NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "image_content"."storage" IS 'The storage destination of the image (eg: local, s3, etc)'`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD "path" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD "properties" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "image_content"."properties" IS 'Properties of the file'`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD "attributes" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "image_content"."attributes" IS 'HTML element attributes (alt, title, etc.)'`,
		);
		await queryRunner.query(
			`ALTER TABLE "image" ADD "section" text NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "image"."section" IS 'The section this image belongs to (product, category, image, etc.)'`,
		);
		await queryRunner.query(
			`ALTER TABLE "image" ADD "image_type" text NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "image"."image_type" IS 'The type of the image (eg: primary, logo, gallery, etc)'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."image_status_enum" AS ENUM('active', 'inactive')`,
		);
		await queryRunner.query(
			`ALTER TABLE "image" ADD "status" "public"."image_status_enum" NOT NULL DEFAULT 'active'`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD "updated_at" TIMESTAMP DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD "deleted_at" TIMESTAMP`,
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
			`ALTER TABLE "article_content" ADD "views" integer NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_category_created_at"`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."cash_flow_category_enum" RENAME TO "cash_flow_category_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_category_enum" AS ENUM('customer', 'employee_salary', 'employee_advance', 'employee_allowance', 'vendor', 'insurance', 'taxes', 'refund')`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "category" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "category" TYPE "public"."cash_flow_category_enum" USING "category"::"text"::"public"."cash_flow_category_enum"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "category" SET DEFAULT 'customer'`,
		);
		await queryRunner.query(
			`DROP TYPE "public"."cash_flow_category_enum_old"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "cash_flow"."amount" IS 'Amount intended to be charged; Note: Divide by 10000 for actual value. e.g. 806452 = 80.6452'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_user_deleted_at" ON "user" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_template_deleted_at" ON "system"."template" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_content_deleted_at" ON "brand_content" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_content_deleted_at" ON "place_content" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_content_storage" ON "image_content" ("storage") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_content_deleted_at" ON "image_content" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_deleted_at" ON "discount" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_section" ON "image" ("section") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_type_id" ON "image" ("entity_id", "section", "image_type") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_deleted_at" ON "image" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_client_deleted_at" ON "client" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_deleted_at" ON "category" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_content_deleted_at" ON "category_content" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_category_created_at" ON "cash_flow" ("category", "created_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_deleted_at" ON "cash_flow" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_carrier_deleted_at" ON "carrier" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_deleted_at" ON "brand" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_deleted_at" ON "place" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_term_deleted_at" ON "term" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_deleted_at" ON "subscription" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_deleted_at" ON "product" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_deleted_at" ON "product_category" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_deleted_at" ON "order_shipping" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_content_deleted_at" ON "product_content" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_product_deleted_at" ON "order_shipping_product" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_deleted_at" ON "product_attribute" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_deleted_at" ON "order" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_deleted_at" ON "order_product" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_tag_deleted_at" ON "product_tag" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_deleted_at" ON "invoice" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_deleted_at" ON "article" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("slug", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_deleted_at" ON "article_content" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_category_deleted_at" ON "article_category" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_tag_deleted_at" ON "article_tag" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "operational_record" ADD CONSTRAINT "FK_55d872f7ba7f7e7692375b1dcf0" FOREIGN KEY ("cash_flow_id") REFERENCES "cash_flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "address" ADD CONSTRAINT "FK_714a4ca3cfd66a718b5f7c3fee5" FOREIGN KEY ("city_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
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
			`ALTER TABLE "address" DROP CONSTRAINT "FK_714a4ca3cfd66a718b5f7c3fee5"`,
		);
		await queryRunner.query(
			`ALTER TABLE "operational_record" DROP CONSTRAINT "FK_55d872f7ba7f7e7692375b1dcf0"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_tag_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_track_article_id_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_deleted_at"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_tag_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_deleted_at"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_product_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_deleted_at"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_brand_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_carrier_deleted_at"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_cash_flow_category_created_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_client_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_type_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_section"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_discount_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_image_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_image_content_storage"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_brand_content_deleted_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_template_deleted_at"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_user_deleted_at"`);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c" UNIQUE ("article_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "cash_flow"."amount" IS 'Amount intended to be charged; Note: It store cents; always divide by 100 for value'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."cash_flow_category_enum_old" AS ENUM('customer', 'fuel', 'maintenance', 'tolls', 'employee_salary', 'employee_reimbursement', 'vendor', 'insurance', 'taxes', 'correction', 'refund')`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "category" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "category" TYPE "public"."cash_flow_category_enum_old" USING "category"::"text"::"public"."cash_flow_category_enum_old"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cash_flow" ALTER COLUMN "category" SET DEFAULT 'customer'`,
		);
		await queryRunner.query(`DROP TYPE "public"."cash_flow_category_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."cash_flow_category_enum_old" RENAME TO "cash_flow_category_enum"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_category_created_at" ON "cash_flow" ("category", "created_at") `,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "views"`,
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
			`ALTER TABLE "order_shipping_product" DROP COLUMN "deleted_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP COLUMN "updated_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP COLUMN "created_at"`,
		);
		await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "status"`);
		await queryRunner.query(`DROP TYPE "public"."image_status_enum"`);
		await queryRunner.query(
			`COMMENT ON COLUMN "image"."image_type" IS 'The type of the image (eg: primary, logo, gallery, etc)'`,
		);
		await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "image_type"`);
		await queryRunner.query(
			`COMMENT ON COLUMN "image"."section" IS 'The section this image belongs to (product, category, image, etc.)'`,
		);
		await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "section"`);
		await queryRunner.query(
			`COMMENT ON COLUMN "image_content"."attributes" IS 'HTML element attributes (alt, title, etc.)'`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP COLUMN "attributes"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "image_content"."properties" IS 'Properties of the file'`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP COLUMN "properties"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP COLUMN "path"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "image_content"."storage" IS 'The storage destination of the image (eg: local, s3, etc)'`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP COLUMN "storage"`,
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
			`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "views" integer NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "image" ADD "is_main" boolean NOT NULL DEFAULT false`,
		);
		await queryRunner.query(`ALTER TABLE "image" ADD "kind" text NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "image" ADD "entity_type" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD "elementAttrs" jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD "fileProps" jsonb NOT NULL`,
		);
		await queryRunner.query(`COMMENT ON TABLE "address" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_address_deleted_at"`);
		await queryRunner.query(`DROP TABLE "address"`);
		await queryRunner.query(
			`COMMENT ON TABLE "operational_record" IS NULL`,
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
		await queryRunner.query(`COMMENT ON TABLE "vendor" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_deleted_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_vendor_name"`);
		await queryRunner.query(`DROP TABLE "vendor"`);
		await queryRunner.query(`DROP TYPE "public"."vendor_status_enum"`);
		await queryRunner.query(
			`COMMENT ON TABLE "article_content" IS 'Language-specific content for articles (title, slug, brief, content, meta)'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("language", "slug") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_cash_flow_gateway_transaction_id" ON "cash_flow" ("gateway", "transaction_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cash_flow_gateway_status" ON "cash_flow" ("gateway", "status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_type_id" ON "image" ("entity_id", "entity_type", "kind") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_image_unique_main" ON "image" ("is_main") `,
		);
	}
}
