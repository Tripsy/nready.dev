import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames `discount.rules` to `discount.conditions` and drops the keys that the now-closed key
 * set no longer admits.
 *
 * `RENAME COLUMN` rather than add/copy/drop: it is a catalogue change in Postgres, keeps every
 * row in place, and cannot half-succeed.
 *
 * `min_order_count`, `client_tags` and `eligible_categories` are removed from the stored JSON.
 * They were never evaluated — the two behavioural ones had no implementation, and
 * `eligible_categories` is targeting, which now lives in `category_discount`. Left in place they
 * would be worse than useless: the evaluator fails closed on an unrecognised key, so every
 * discount carrying one would silently stop applying.
 */
export class DiscountConditions1786700000000 implements MigrationInterface {
	name = 'DiscountConditions1786700000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "discount" RENAME COLUMN "rules" TO "conditions"`,
		);

		await queryRunner.query(
			`UPDATE "discount"
			 SET "conditions" = "conditions" - 'min_order_count' - 'client_tags' - 'eligible_categories'
			 WHERE "conditions" IS NOT NULL
			   AND ("conditions" ?| array['min_order_count', 'client_tags', 'eligible_categories'])`,
		);

		// A row whose only keys were the stripped ones now holds `{}`, which reads as "no
		// conditions" but is not the same as never having had any. Normalised so the evaluator
		// and the dashboard both see one representation of "unconditional".
		await queryRunner.query(
			`UPDATE "discount" SET "conditions" = NULL WHERE "conditions" = '{}'::jsonb`,
		);

		await queryRunner.query(
			`COMMENT ON COLUMN "discount"."conditions" IS 'Conditions the discount is subject to; all must be met for it to apply'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "discount" RENAME COLUMN "conditions" TO "rules"`,
		);

		// The stripped keys are not restored: nothing recorded which rows carried them.
		await queryRunner.query(
			`COMMENT ON COLUMN "discount"."rules" IS 'Optional rules or conditions for discount applicability'`,
		);
	}
}
