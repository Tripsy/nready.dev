import type { MigrationInterface, QueryRunner } from 'typeorm';

export class LogDataCategory1787453095727 implements MigrationInterface {
	name = 'LogDataCategory1787453095727';

	/**
	 * Drops `info` and `error` from the log-data category enum. Postgres cannot remove a value
	 * from an enum type, so the type is rebuilt and the column cast across.
	 *
	 * The cast cannot fail on existing data: `logger.provider.ts` only ever writes `system`,
	 * `history` and `cron`, so no row has ever carried either of the dropped values. Severity
	 * is `level`, which is a separate enum and untouched here.
	 *
	 * The index on (level, category, created_at) is not dropped and recreated — Postgres
	 * rebuilds an index over an altered column on its own.
	 */
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "logs"."log_data_category_enum" RENAME TO "log_data_category_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "logs"."log_data_category_enum" AS ENUM('system', 'history', 'cron')`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_data" ALTER COLUMN "category" TYPE "logs"."log_data_category_enum" USING "category"::"text"::"logs"."log_data_category_enum"`,
		);
		await queryRunner.query(
			`DROP TYPE "logs"."log_data_category_enum_old"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "logs"."log_data_category_enum" RENAME TO "log_data_category_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "logs"."log_data_category_enum" AS ENUM('system', 'history', 'cron', 'info', 'error')`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_data" ALTER COLUMN "category" TYPE "logs"."log_data_category_enum" USING "category"::"text"::"logs"."log_data_category_enum"`,
		);
		await queryRunner.query(
			`DROP TYPE "logs"."log_data_category_enum_old"`,
		);
	}
}
