import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The four link tables that give a discount its targets, siblings of the `product_discount`
 * that already existed: `client_discount`, `variant_discount`, `category_discount`,
 * `brand_discount`.
 *
 * Each is shaped the same way. The partial unique index leads on the owner column, so it
 * doubles as the lookup index the resolver reads ("which discounts point at this brand") and
 * no second index is needed on that side. Both foreign keys cascade: a link means nothing once
 * either end is gone, and a discount already applied to an order survives as a snapshot on the
 * order line rather than through these rows.
 *
 * Written by hand from TypeORM's generated output, with its unrelated `document_series` column
 * drops removed — that is drift between the entity and this database, not part of this change.
 */
export class DiscountTargets1786610215138 implements MigrationInterface {
	name = 'DiscountTargets1786610215138';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "brand_discount" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "brand_id" integer NOT NULL, "discount_id" integer NOT NULL, CONSTRAINT "PK_50bb6d187402d7bcde7842e7080" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_discount_discount_id" ON "brand_discount"  ("discount_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_brand_discount_unique" ON "brand_discount"  ("brand_id", "discount_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_discount_deleted_at" ON "brand_discount"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "brand_discount" IS 'Links brands to discounts with \`brand\` scope; the window and the rules stay on the discount itself'`,
		);

		await queryRunner.query(
			`CREATE TABLE "category_discount" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "category_id" integer NOT NULL, "discount_id" integer NOT NULL, CONSTRAINT "PK_142330bd8d2e4811adff59592ec" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_discount_discount_id" ON "category_discount"  ("discount_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_category_discount_unique" ON "category_discount"  ("category_id", "discount_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_discount_deleted_at" ON "category_discount"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "category_discount" IS 'Links categories to discounts with \`category\` scope; applies to the whole subtree via category_closure'`,
		);

		await queryRunner.query(
			`CREATE TABLE "client_discount" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "client_id" integer NOT NULL, "discount_id" integer NOT NULL, CONSTRAINT "PK_5c3a55299894f8256415be76998" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_client_discount_discount_id" ON "client_discount"  ("discount_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_client_discount_unique" ON "client_discount"  ("client_id", "discount_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_client_discount_deleted_at" ON "client_discount"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "client_discount" IS 'Links clients to discounts with \`client\` scope; the window and the rules stay on the discount itself'`,
		);

		await queryRunner.query(
			`CREATE TABLE "variant_discount" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "variant_id" integer NOT NULL, "discount_id" integer NOT NULL, CONSTRAINT "PK_06d651d047fc6d8e642785e289c" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_variant_discount_discount_id" ON "variant_discount"  ("discount_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_variant_discount_unique" ON "variant_discount"  ("variant_id", "discount_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_variant_discount_deleted_at" ON "variant_discount"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "variant_discount" IS 'Links product variants to discounts with \`variant\` scope; the window and the rules stay on the discount itself'`,
		);

		await queryRunner.query(
			`ALTER TABLE "brand_discount" ADD CONSTRAINT "FK_1cf450a2c7f4ee80ac80e9ec4e0" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_discount" ADD CONSTRAINT "FK_40ea1aec5f8e3cb7a3e87a93835" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_discount" ADD CONSTRAINT "FK_d706ff8f643e756998ab0a4ac2c" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_discount" ADD CONSTRAINT "FK_5c67e671baf0d81cad87e6948a9" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client_discount" ADD CONSTRAINT "FK_262cbb5a862cc2e8bea04a2557d" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client_discount" ADD CONSTRAINT "FK_81736b784862cc7fc436f391c8a" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "variant_discount" ADD CONSTRAINT "FK_58aa542cbc8a3f186415f4360cd" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "variant_discount" ADD CONSTRAINT "FK_71c80c740751d212d1328d1049b" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "variant_discount" DROP CONSTRAINT "FK_71c80c740751d212d1328d1049b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "variant_discount" DROP CONSTRAINT "FK_58aa542cbc8a3f186415f4360cd"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client_discount" DROP CONSTRAINT "FK_81736b784862cc7fc436f391c8a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client_discount" DROP CONSTRAINT "FK_262cbb5a862cc2e8bea04a2557d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_discount" DROP CONSTRAINT "FK_5c67e671baf0d81cad87e6948a9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_discount" DROP CONSTRAINT "FK_d706ff8f643e756998ab0a4ac2c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_discount" DROP CONSTRAINT "FK_40ea1aec5f8e3cb7a3e87a93835"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_discount" DROP CONSTRAINT "FK_1cf450a2c7f4ee80ac80e9ec4e0"`,
		);

		await queryRunner.query(`DROP TABLE "variant_discount"`);
		await queryRunner.query(`DROP TABLE "client_discount"`);
		await queryRunner.query(`DROP TABLE "category_discount"`);
		await queryRunner.query(`DROP TABLE "brand_discount"`);
	}
}
