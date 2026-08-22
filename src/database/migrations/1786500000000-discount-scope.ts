import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reshapes `discount.scope` for target-based resolution: adds `variant` and `brand`, drops
 * `country`.
 *
 * Postgres cannot remove a value from an enum, so the column is swapped onto a freshly
 * created type. `IDX_discount_active` covers `scope` and has to come down for the duration —
 * a `USING` cast rewrites the column, and the index cannot survive its own column changing
 * type.
 */
export class DiscountScope1786500000000 implements MigrationInterface {
	name = 'DiscountScope1786500000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		/*
		 * Country-scoped rows become order-scoped. Their country list already lives in
		 * `rules.applicable_countries`, which is where the resolver reads it from, so the
		 * targeting information survives the move. Rows that somehow lack the key keep an
		 * empty list rather than silently becoming a discount for everyone.
		 */
		await queryRunner.query(
			`UPDATE "discount"
			 SET "rules" = COALESCE("rules", '{}'::jsonb) || '{"applicable_countries": []}'::jsonb
			 WHERE "scope" = 'country'
			   AND ("rules" IS NULL OR NOT ("rules" ? 'applicable_countries'))`,
		);

		await queryRunner.query(`DROP INDEX "public"."IDX_discount_active"`);

		await queryRunner.query(
			`CREATE TYPE "public"."discount_scope_enum_new" AS ENUM('client', 'order', 'product', 'variant', 'category', 'brand')`,
		);

		await queryRunner.query(
			`ALTER TABLE "discount"
			 ALTER COLUMN "scope" TYPE "public"."discount_scope_enum_new"
			 USING (CASE WHEN "scope"::text = 'country' THEN 'order' ELSE "scope"::text END)::"public"."discount_scope_enum_new"`,
		);

		await queryRunner.query(`DROP TYPE "public"."discount_scope_enum"`);

		await queryRunner.query(
			`ALTER TYPE "public"."discount_scope_enum_new" RENAME TO "discount_scope_enum"`,
		);

		await queryRunner.query(
			`CREATE INDEX "IDX_discount_active" ON "discount"  ("start_at", "end_at", "scope") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_active"`);

		await queryRunner.query(
			`CREATE TYPE "public"."discount_scope_enum_old" AS ENUM('client', 'order', 'product', 'category', 'country')`,
		);

		/*
		 * `variant` folds back to `product` and `brand` to `category`, the nearest surviving
		 * scope in each case. This is lossy and cannot be otherwise — the old enum has no
		 * room for either — and the rows that were country-scoped before the up migration
		 * stay `order`, since nothing recorded which ones they were.
		 */
		await queryRunner.query(
			`ALTER TABLE "discount"
			 ALTER COLUMN "scope" TYPE "public"."discount_scope_enum_old"
			 USING (CASE
			     WHEN "scope"::text = 'variant' THEN 'product'
			     WHEN "scope"::text = 'brand' THEN 'category'
			     ELSE "scope"::text
			 END)::"public"."discount_scope_enum_old"`,
		);

		await queryRunner.query(`DROP TYPE "public"."discount_scope_enum"`);

		await queryRunner.query(
			`ALTER TYPE "public"."discount_scope_enum_old" RENAME TO "discount_scope_enum"`,
		);

		await queryRunner.query(
			`CREATE INDEX "IDX_discount_active" ON "discount"  ("start_at", "end_at", "scope") `,
		);
	}
}
