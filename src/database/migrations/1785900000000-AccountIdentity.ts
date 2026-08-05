import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountIdentity1785900000000 implements MigrationInterface {
	name = 'AccountIdentity1785900000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "system"."account_identity_provider_enum" AS ENUM('google', 'facebook')`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."account_identity" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "provider" "system"."account_identity_provider_enum" NOT NULL, "provider_user_id" character varying(191) NOT NULL, "email" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_login_at" TIMESTAMP, CONSTRAINT "PK_account_identity" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."account_identity"."provider_user_id" IS 'Subject id as reported by the provider (\`sub\` / Graph \`id\`)'; COMMENT ON COLUMN "system"."account_identity"."email" IS 'Email reported by the provider at link time; kept for auditing only'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_account_identity_provider_subject" ON "system"."account_identity"  ("provider", "provider_user_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_account_identity_user_provider" ON "system"."account_identity"  ("user_id", "provider") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_identity" IS 'Links a user to an external identity provider (social sign-in)'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_identity" ADD CONSTRAINT "FK_51838685440a76e0e0495225836" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);

		// An account created through social sign-in has no password at all.
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		/*
		 * Restoring NOT NULL requires every row to have a password, which social sign-in
		 * accounts do not. They are dropped rather than given an unusable placeholder hash:
		 * a placeholder would be indistinguishable from a real credential afterwards, and
		 * these accounts are exactly the ones the reverted code cannot authenticate anyway.
		 */
		await queryRunner.query(`DELETE FROM "user" WHERE "password" IS NULL`);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`,
		);

		await queryRunner.query(
			`ALTER TABLE "system"."account_identity" DROP CONSTRAINT "FK_51838685440a76e0e0495225836"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_identity_user_provider"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_identity_provider_subject"`,
		);
		await queryRunner.query(`DROP TABLE "system"."account_identity"`);
		await queryRunner.query(
			`DROP TYPE "system"."account_identity_provider_enum"`,
		);
	}
}
