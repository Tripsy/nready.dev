import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ArticleRuleSubscriptionBoolean1787100000000
	implements MigrationInterface
{
	name = 'ArticleRuleSubscriptionBoolean1787100000000';

	/**
	 * The column held plan identifiers, but nothing ever matched against them — the access
	 * policy only proved the reader had *an* active subscription. A populated array therefore
	 * meant exactly "a subscription is required", which is what the boolean now says.
	 */
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" ADD "requires_subscription_bool" boolean NOT NULL DEFAULT false`,
		);
		await queryRunner.query(
			`UPDATE "article_visibility_rule" SET "requires_subscription_bool" = true WHERE "requires_subscription" IS NOT NULL AND cardinality("requires_subscription") > 0`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" DROP COLUMN "requires_subscription"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" RENAME COLUMN "requires_subscription_bool" TO "requires_subscription"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_visibility_rule"."requires_subscription" IS 'An active subscription is required to view the article'`,
		);
	}

	/**
	 * The plan identifiers are gone for good — they were never read, and `true` carries no
	 * record of which plans were listed. The down path restores the shape with an empty array
	 * where the flag was set, which is the closest honest reconstruction.
	 */
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" ADD "requires_subscription_arr" character varying array`,
		);
		await queryRunner.query(
			`UPDATE "article_visibility_rule" SET "requires_subscription_arr" = '{}' WHERE "requires_subscription" = true`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" DROP COLUMN "requires_subscription"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_visibility_rule" RENAME COLUMN "requires_subscription_arr" TO "requires_subscription"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_visibility_rule"."requires_subscription" IS 'Subscription plan identifiers granting access; null means subscription is not required'`,
		);
	}
}
