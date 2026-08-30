import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Collapses the five per-kind link tables into one polymorphic `discount_target`.
 *
 * The typed tables had to live in the feature owning the other end, which made `client`,
 * `category`, `brand` and `product` all depend on `discount` — backwards, since discounts are
 * the optional part of a catalog. One table on the discount side reverses that, and turns the
 * resolver's five-query fan-out into a single indexed lookup.
 *
 * `product_discount` predates this work and is folded in with the rest. Its rows move; the
 * `ProductEntity.discounts` relation that read it is gone.
 */
export class DiscountTargetPolymorphic1786800000000
	implements MigrationInterface
{
	name = 'DiscountTargetPolymorphic1786800000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."discount_target_target_type_enum" AS ENUM('client', 'variant', 'product', 'category', 'brand')`,
		);

		await queryRunner.query(
			`CREATE TABLE "discount_target" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "discount_id" integer NOT NULL, "target_type" "public"."discount_target_target_type_enum" NOT NULL, "entity_id" integer NOT NULL, CONSTRAINT "PK_discount_target" PRIMARY KEY ("id"))`,
		);

		/*
		 * Carries the timestamps across rather than defaulting them to now: these rows are the
		 * same facts under a new shape, and "when was this discount pointed at that category"
		 * is worth keeping.
		 */
		const sources: [string, string, string][] = [
			['client_discount', 'client_id', 'client'],
			['variant_discount', 'variant_id', 'variant'],
			['product_discount', 'product_id', 'product'],
			['category_discount', 'category_id', 'category'],
			['brand_discount', 'brand_id', 'brand'],
		];

		for (const [table, column, targetType] of sources) {
			await queryRunner.query(
				`INSERT INTO "discount_target" ("discount_id", "target_type", "entity_id", "created_at", "updated_at", "deleted_at")
				 SELECT "discount_id", '${targetType}'::"public"."discount_target_target_type_enum", "${column}", "created_at", "updated_at", "deleted_at"
				 FROM "${table}"`,
			);
		}

		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_discount_target_unique" ON "discount_target"  ("discount_id", "target_type", "entity_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_target_entity" ON "discount_target"  ("target_type", "entity_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_target_deleted_at" ON "discount_target"  ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "discount_target" IS 'What a discount applies to; polymorphic by target_type, the window and conditions stay on the discount'`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount_target" ADD CONSTRAINT "FK_discount_target_discount" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);

		for (const [table] of sources) {
			await queryRunner.query(`DROP TABLE "${table}"`);
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		const sources: [string, string, string, string][] = [
			['client_discount', 'client_id', 'client', 'client'],
			['variant_discount', 'variant_id', 'variant', 'product_variant'],
			['product_discount', 'product_id', 'product', 'product'],
			['category_discount', 'category_id', 'category', 'category'],
			['brand_discount', 'brand_id', 'brand', 'brand'],
		];

		for (const [table, column, targetType, ownerTable] of sources) {
			await queryRunner.query(
				`CREATE TABLE "${table}" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "${column}" integer NOT NULL, "discount_id" integer NOT NULL, CONSTRAINT "PK_${table}" PRIMARY KEY ("id"))`,
			);

			/*
			 * `WHERE EXISTS` because the polymorphic column carries no foreign key: rows may
			 * point at owners deleted since, and the typed tables cascade so they cannot hold
			 * them. Those rows are dropped rather than blocking the rollback.
			 */
			await queryRunner.query(
				`INSERT INTO "${table}" ("discount_id", "${column}", "created_at", "updated_at", "deleted_at")
				 SELECT t."discount_id", t."entity_id", t."created_at", t."updated_at", t."deleted_at"
				 FROM "discount_target" t
				 WHERE t."target_type" = '${targetType}'
				   AND EXISTS (SELECT 1 FROM "${ownerTable}" o WHERE o."id" = t."entity_id")`,
			);

			await queryRunner.query(
				`CREATE INDEX "IDX_${table}_discount_id" ON "${table}"  ("discount_id") `,
			);
			await queryRunner.query(
				`CREATE UNIQUE INDEX "IDX_${table}_unique" ON "${table}"  ("${column}", "discount_id") WHERE deleted_at IS NULL`,
			);
			await queryRunner.query(
				`CREATE INDEX "IDX_${table}_deleted_at" ON "${table}"  ("deleted_at") WHERE deleted_at IS NULL`,
			);
			await queryRunner.query(
				`ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_owner" FOREIGN KEY ("${column}") REFERENCES "${ownerTable}"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
			);
			await queryRunner.query(
				`ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_discount" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
			);
		}

		await queryRunner.query(`DROP TABLE "discount_target"`);
		await queryRunner.query(
			`DROP TYPE "public"."discount_target_target_type_enum"`,
		);
	}
}
