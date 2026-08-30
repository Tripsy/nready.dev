import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames the `cancelled` label to `canceled` on the four status enums, bringing the database
 * in line with the en-US spelling the codebase uses (see CLAUDE.md, "Code Comments").
 *
 * `RENAME VALUE` rather than the rebuild dance in `1787800000000-complaint-reason-enum.ts`:
 * that one had to drop values, which Postgres cannot do in place, while renaming a label is a
 * catalog-only change. Existing rows follow the label automatically, so no data is rewritten
 * and no column is converted.
 *
 * Guarded on the label still being `cancelled`, because `1786415988228-init.ts` was rewritten
 * to create the enums as `canceled` — a database built from scratch therefore never has the
 * old label, and an unguarded `RENAME VALUE` would fail on it. Both paths converge here: a
 * database created before this change is renamed, a fresh one is left alone.
 */
export class StatusCanceledSpelling1788200000000 implements MigrationInterface {
	name = 'StatusCanceledSpelling1788200000000';

	private static readonly ENUM_TYPES = [
		'grn_status_enum',
		'invoice_status_enum',
		'order_status_enum',
		'subscription_status_enum',
	];

	private static renameLabel(from: string, to: string): string {
		const types = StatusCanceledSpelling1788200000000.ENUM_TYPES.map(
			(type) => `'${type}'`,
		).join(', ');

		return `
			DO $$
			DECLARE enum_type text;
			BEGIN
				FOREACH enum_type IN ARRAY ARRAY[${types}]
				LOOP
					IF EXISTS (
						SELECT 1
						FROM pg_enum e
						JOIN pg_type t ON t.oid = e.enumtypid
						JOIN pg_namespace n ON n.oid = t.typnamespace
						WHERE n.nspname = 'public'
							AND t.typname = enum_type
							AND e.enumlabel = '${from}'
					) THEN
						EXECUTE format(
							'ALTER TYPE public.%I RENAME VALUE %L TO %L',
							enum_type, '${from}', '${to}'
						);
					END IF;
				END LOOP;
			END $$;
		`;
	}

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			StatusCanceledSpelling1788200000000.renameLabel(
				'cancelled',
				'canceled',
			),
		);

		// Carried on the entity as a `comment:`, so it drifts into a schema diff if left behind.
		await queryRunner.query(
			`COMMENT ON COLUMN "subscription"."end_at" IS 'When the subscription ended (if canceled/expired)'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			StatusCanceledSpelling1788200000000.renameLabel(
				'canceled',
				'cancelled',
			),
		);

		await queryRunner.query(
			`COMMENT ON COLUMN "subscription"."end_at" IS 'When the subscription ended (if cancelled/expired)'`,
		);
	}
}
