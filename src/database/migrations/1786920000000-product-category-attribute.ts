import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Declares, per category, which attributes a product is expected to carry — and moves the recorded
 * values off `term` for everything that is not shared vocabulary.
 *
 * An attribute value used to be a `term` id and nothing else, so a measurement had to be spelled
 * out as one: "500 ml" was an `attribute_value` row, per language, and filtering products by volume
 * meant casting localized text with no index in reach. `product_attribute` now stores the number
 * bare in `value_numeric`, with the unit fixed by the definition, and carries `value_base` — the
 * same figure converted into its dimension's base unit — so a range filter is an index-only scan
 * and stays correct across categories that quote the label differently (`ml` here, `l` there).
 *
 * `attribute_value_id` is **renamed** rather than dropped and re-added: every existing value is a
 * term id and remains valid as `value_term_id`, so the move is lossless. The column becomes
 * nullable because a scalar value now lives in one of the three new columns instead, which is also
 * why the unique index splits in two — a nullable column inside the old three-column key would
 * enforce nothing, Postgres counting every NULL as distinct.
 *
 * No backfill of `value_base` is needed: the columns it pairs with are introduced here, so no row
 * can have a number yet. Once the service exists, changing a definition's `unit` does require
 * rewriting every value under it — see `.claude/rules/product.md` §10.11.
 */
export class ProductCategoryAttribute1786920000000
	implements MigrationInterface
{
	name = 'ProductCategoryAttribute1786920000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		/*
		 * The definition table. `unit` is a plain varchar holding a `MeasureUnitEnum` key rather
		 * than a Postgres enum, for the reason `product.vat_category` gives: the list grows, and
		 * `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block.
		 */
		await queryRunner.query(
			`CREATE TYPE "public"."product_category_attribute_scope_enum" AS ENUM('product', 'variant')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_category_attribute_value_type_enum" AS ENUM('term', 'number', 'string', 'boolean')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_category_attribute_type_enum" AS ENUM('input', 'select', 'radio', 'checkbox')`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_category_attribute" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "category_id" integer NOT NULL, "attribute_label_id" integer NOT NULL, "scope" "public"."product_category_attribute_scope_enum" NOT NULL DEFAULT 'product', "value_type" "public"."product_category_attribute_value_type_enum" NOT NULL DEFAULT 'term', "type" "public"."product_category_attribute_type_enum" NOT NULL DEFAULT 'select', "unit" character varying(16), "prefix" character varying(16), "suffix" character varying(16), "min_value" numeric(14,4), "max_value" numeric(14,4), "is_required" boolean NOT NULL DEFAULT false, "is_filterable" boolean NOT NULL DEFAULT false, "inherit" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "CHK_0d6db621eeec5734c6c409e708" CHECK (
	((min_value IS NULL AND max_value IS NULL) OR value_type = 'number')
	AND (min_value IS NULL OR max_value IS NULL OR min_value <= max_value)
), CONSTRAINT "CHK_3f7bd35546f4ec0bc6062c587c" CHECK (
	(unit IS NULL OR value_type = 'number')
	AND NOT (unit IS NOT NULL AND suffix IS NOT NULL)
), CONSTRAINT "CHK_3313378a263ecec379a0177c6f" CHECK (
	(type = 'input' AND value_type IN ('number', 'string', 'boolean'))
	OR (type IN ('select', 'radio') AND value_type = 'term')
	OR (type = 'checkbox' AND value_type IN ('term', 'boolean'))
), CONSTRAINT "PK_4b82fb3ff49209b417aaa3ff23c" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_category_attribute"."value_type" IS 'Decides which value column the attribute row occupies'; COMMENT ON COLUMN "product_category_attribute"."type" IS 'How the value is captured'; COMMENT ON COLUMN "product_category_attribute"."unit" IS 'MeasureUnitEnum key; numeric attributes only'; COMMENT ON COLUMN "product_category_attribute"."prefix" IS 'Rendered before the value (e.g. \`class\`)'; COMMENT ON COLUMN "product_category_attribute"."suffix" IS 'Rendered after the value when no \`unit\` applies'; COMMENT ON COLUMN "product_category_attribute"."min_value" IS 'Lowest accepted value; numeric attributes only'; COMMENT ON COLUMN "product_category_attribute"."max_value" IS 'Highest accepted value; numeric attributes only'; COMMENT ON COLUMN "product_category_attribute"."is_required" IS 'Whether a product in this category must supply the attribute'; COMMENT ON COLUMN "product_category_attribute"."sort_order" IS 'Display order within the category'`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_category_attribute" IS 'Per-category definition of the attributes a product is expected to carry'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_attribute_label_id" ON "product_category_attribute"  ("attribute_label_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_attribute_category_id" ON "product_category_attribute"  ("category_id", "sort_order") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_category_attribute_unique" ON "product_category_attribute"  ("category_id", "attribute_label_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_attribute_deleted_at" ON "product_category_attribute"  ("deleted_at") WHERE deleted_at IS NULL`,
		);

		/*
		 * The admissible values for a list-backed definition. A table pointing at `term` rather
		 * than a jsonb array of strings: the wording renders per language, two categories offering
		 * the same list share the records, and the product stores that same term id as its value.
		 */
		await queryRunner.query(
			`CREATE TABLE "product_category_attribute_option" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "attribute_id" integer NOT NULL, "term_id" integer NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_369f7ce719988e26ac668b6c3f7" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_category_attribute_option"."sort_order" IS 'Order the option is offered in'`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_category_attribute_option" IS 'One admissible value for a list-backed product category attribute'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_attribute_option_term_id" ON "product_category_attribute_option"  ("term_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_category_attribute_option_unique" ON "product_category_attribute_option"  ("attribute_id", "term_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_attribute_option_attribute_id" ON "product_category_attribute_option"  ("attribute_id", "sort_order") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_attribute_option_deleted_at" ON "product_category_attribute_option"  ("deleted_at") WHERE deleted_at IS NULL`,
		);

		await queryRunner.query(
			`ALTER TABLE "product_category_attribute" ADD CONSTRAINT "FK_4965e459a87464b19a3a6faa0f4" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category_attribute" ADD CONSTRAINT "FK_bd3057258005075780251b33912" FOREIGN KEY ("attribute_label_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category_attribute_option" ADD CONSTRAINT "FK_faf5f9bb3eb451aa8e8fc8623aa" FOREIGN KEY ("attribute_id") REFERENCES "product_category_attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category_attribute_option" ADD CONSTRAINT "FK_cd9a281c5902ff59b0d1959cd5c" FOREIGN KEY ("term_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);

		/*
		 * `product_attribute` — the value stops being a term id only.
		 *
		 * The foreign key is dropped before the rename and recreated after, rather than left to
		 * follow the column: its name is derived from the column it covers, and a constraint still
		 * called `FK_e9d73f2bb641f92f8d48b13ee7d` would show up as a diff on every future
		 * `migration:generate`.
		 */
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_attribute_value_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_unique"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" RENAME COLUMN "attribute_value_id" TO "value_term_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ALTER COLUMN "value_term_id" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "value_numeric" numeric(14,4)`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_attribute"."value_numeric" IS 'Bare measurement as entered; the unit comes from the definition'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "value_base" numeric(20,6)`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_attribute"."value_base" IS 'Normalized measurement; what range filters compare'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "value_text" character varying(255)`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "value_boolean" boolean`,
		);

		/*
		 * Every pre-existing row carries a term id and no scalar, so it satisfies the check as it
		 * stands — nothing to repair before adding it.
		 */
		await queryRunner.query(`ALTER TABLE "product_attribute" ADD CONSTRAINT "CHK_aa707808285fe47e69e3c8edbc" CHECK (
	(
		(value_term_id IS NOT NULL)::int
		+ (value_numeric IS NOT NULL)::int
		+ (value_text IS NOT NULL)::int
		+ (value_boolean IS NOT NULL)::int
	) = 1
	AND (value_numeric IS NULL) = (value_base IS NULL)
)`);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_ebca7f2c5f70c7988c09256c327" FOREIGN KEY ("value_term_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_attribute_value_id" ON "product_attribute"  ("value_term_id") `,
		);
		/*
		 * Uniqueness in two halves. Term-backed rows keep the value in the key, so a product may
		 * still list three allergens under one label; scalar rows are keyed on the label alone, so
		 * a product has exactly one volume.
		 */
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_attribute_unique" ON "product_attribute"  ("product_id", "attribute_label_id", "value_term_id") WHERE value_term_id IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_attribute_unique_scalar" ON "product_attribute"  ("product_id", "attribute_label_id") WHERE value_term_id IS NULL AND deleted_at IS NULL`,
		);
		// Facet indexes: leading on the label because a filter always names one, carrying the
		// owning id so the scan answers from the index alone
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_term_facet" ON "product_attribute"  ("attribute_label_id", "value_term_id", "product_id") WHERE value_term_id IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_numeric_facet" ON "product_attribute"  ("attribute_label_id", "value_base", "product_id") WHERE value_base IS NOT NULL AND deleted_at IS NULL`,
		);

		/*
		 * `product_variant_attribute` — the same treatment, minus the unique index, which is keyed
		 * on `(variant_id, attribute_label_id)` and already admits exactly one value per axis.
		 */
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP CONSTRAINT "FK_dbfdf59a749dc93e8e04e3b0cfa"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_attribute_value_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" RENAME COLUMN "attribute_value_id" TO "value_term_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ALTER COLUMN "value_term_id" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ADD "value_numeric" numeric(14,4)`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_variant_attribute"."value_numeric" IS 'Bare measurement as entered; the unit comes from the definition'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ADD "value_base" numeric(20,6)`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_variant_attribute"."value_base" IS 'Normalized measurement; what range filters compare'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ADD "value_text" character varying(255)`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ADD "value_boolean" boolean`,
		);
		await queryRunner.query(`ALTER TABLE "product_variant_attribute" ADD CONSTRAINT "CHK_9e4e03d1a5048face1dd805f66" CHECK (
	(
		(value_term_id IS NOT NULL)::int
		+ (value_numeric IS NOT NULL)::int
		+ (value_text IS NOT NULL)::int
		+ (value_boolean IS NOT NULL)::int
	) = 1
	AND (value_numeric IS NULL) = (value_base IS NULL)
)`);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ADD CONSTRAINT "FK_751b01e4f321fcc21c0bd9873c8" FOREIGN KEY ("value_term_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_attribute_value_id" ON "product_variant_attribute"  ("value_term_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_attribute_term_facet" ON "product_variant_attribute"  ("attribute_label_id", "value_term_id", "variant_id") WHERE value_term_id IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_attribute_numeric_facet" ON "product_variant_attribute"  ("attribute_label_id", "value_base", "variant_id") WHERE value_base IS NOT NULL AND deleted_at IS NULL`,
		);
	}

	/**
	 * The old shape has nowhere to put a scalar value, and `attribute_value_id` was `NOT NULL`, so
	 * any row holding a number, string or boolean is **deleted** rather than silently mangled into
	 * a term it never had. Term-backed rows survive the round trip untouched.
	 */
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_attribute_numeric_facet"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_attribute_term_facet"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_attribute_value_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP CONSTRAINT "FK_751b01e4f321fcc21c0bd9873c8"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP CONSTRAINT "CHK_9e4e03d1a5048face1dd805f66"`,
		);
		await queryRunner.query(
			`DELETE FROM "product_variant_attribute" WHERE "value_term_id" IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP COLUMN "value_boolean"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP COLUMN "value_text"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP COLUMN "value_base"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" DROP COLUMN "value_numeric"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ALTER COLUMN "value_term_id" SET NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" RENAME COLUMN "value_term_id" TO "attribute_value_id"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_attribute_value_id" ON "product_variant_attribute"  ("attribute_value_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant_attribute" ADD CONSTRAINT "FK_dbfdf59a749dc93e8e04e3b0cfa" FOREIGN KEY ("attribute_value_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);

		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_numeric_facet"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_term_facet"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_unique_scalar"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_attribute_value_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_ebca7f2c5f70c7988c09256c327"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "CHK_aa707808285fe47e69e3c8edbc"`,
		);
		await queryRunner.query(
			`DELETE FROM "product_attribute" WHERE "value_term_id" IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "value_boolean"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "value_text"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "value_base"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "value_numeric"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ALTER COLUMN "value_term_id" SET NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" RENAME COLUMN "value_term_id" TO "attribute_value_id"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_attribute_value_id" ON "product_attribute"  ("attribute_value_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_attribute_unique" ON "product_attribute"  ("product_id", "attribute_label_id", "attribute_value_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d" FOREIGN KEY ("attribute_value_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);

		await queryRunner.query(
			`ALTER TABLE "product_category_attribute_option" DROP CONSTRAINT "FK_cd9a281c5902ff59b0d1959cd5c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category_attribute_option" DROP CONSTRAINT "FK_faf5f9bb3eb451aa8e8fc8623aa"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category_attribute" DROP CONSTRAINT "FK_bd3057258005075780251b33912"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category_attribute" DROP CONSTRAINT "FK_4965e459a87464b19a3a6faa0f4"`,
		);
		await queryRunner.query(
			`DROP TABLE "product_category_attribute_option"`,
		);
		await queryRunner.query(`DROP TABLE "product_category_attribute"`);
		await queryRunner.query(
			`DROP TYPE "public"."product_category_attribute_type_enum"`,
		);
		await queryRunner.query(
			`DROP TYPE "public"."product_category_attribute_value_type_enum"`,
		);
		await queryRunner.query(
			`DROP TYPE "public"."product_category_attribute_scope_enum"`,
		);
	}
}
