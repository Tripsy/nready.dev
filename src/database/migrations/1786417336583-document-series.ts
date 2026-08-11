import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentSeries1786417336583 implements MigrationInterface {
	name = 'DocumentSeries1786417336583';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."document_series_document_type_enum" AS ENUM('invoice', 'order', 'grn', 'subscription')`,
		);
		await queryRunner.query(
			`CREATE TABLE "document_series" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "document_type" "public"."document_series_document_type_enum" NOT NULL, "code" character varying(10) NOT NULL, "start_number" integer NOT NULL DEFAULT '1', "next_number" integer NOT NULL DEFAULT '1', "padding" smallint NOT NULL DEFAULT '0', "format" character varying NOT NULL DEFAULT '{code}-{number}', "notes" text, CONSTRAINT "CHK_7af3c7477454ab008da51fe079" CHECK (("padding" BETWEEN 0 AND 12)), CONSTRAINT "CHK_6e54f807fe46f0a46ca80ad5b2" CHECK (("start_number" > 0 AND "next_number" > 0)), CONSTRAINT "PK_187a27e33f96d78f669301cf572" PRIMARY KEY ("id")); COMMENT ON COLUMN "document_series"."code" IS 'Series prefix, e.g. INV'; COMMENT ON COLUMN "document_series"."start_number" IS 'First number of the series'; COMMENT ON COLUMN "document_series"."next_number" IS 'Number handed out by the next allocation'; COMMENT ON COLUMN "document_series"."padding" IS 'Zero-padding width applied to {number}; 0 = no padding'; COMMENT ON COLUMN "document_series"."format" IS 'Reference template, placeholders {code} {number}'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_document_series_key" ON "document_series"  ("document_type") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "document_series" IS 'Document numbering series and their counters'`,
		);

		// Widened in place. Dropping and re-adding the column, as TypeORM generates, discards
		// every reference already issued; `ALTER COLUMN … TYPE` to a wider varchar is a
		// metadata-only change in Postgres and rewrites nothing.
		await queryRunner.query(
			`ALTER TABLE "invoice" ALTER COLUMN "ref_code" TYPE character varying(10)`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "invoice"."ref_code" IS 'Series code allocated from document_series, e.g. INV'`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn" ALTER COLUMN "ref_code" TYPE character varying(10)`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "grn"."ref_code" IS 'Series code allocated from document_series, e.g. NIR'`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ALTER COLUMN "ref_code" TYPE character varying(10)`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "order"."ref_code" IS 'Series code allocated from document_series, e.g. ORD'`,
		);

		// Rebuilt with the series as the leftmost column, so listing one series can use it
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_ref"`);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_invoice_ref" ON "invoice"  ("ref_code", "ref_number") WHERE deleted_at IS NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_ref"`);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_invoice_ref" ON "invoice" USING btree ("ref_number", "ref_code") WHERE (deleted_at IS NULL)`,
		);

		// Narrowing back fails loudly if a code longer than three characters was issued, which is
		// the correct outcome — the alternative silently truncates a live reference
		await queryRunner.query(
			`COMMENT ON COLUMN "order"."ref_code" IS 'Document series, e.g. ORD'`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ALTER COLUMN "ref_code" TYPE character varying(3)`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "grn"."ref_code" IS 'Document series, e.g. NIR'`,
		);
		await queryRunner.query(
			`ALTER TABLE "grn" ALTER COLUMN "ref_code" TYPE character varying(3)`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "invoice"."ref_code" IS 'Invoice series/code, e.g., ABC'`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" ALTER COLUMN "ref_code" TYPE character varying(3)`,
		);

		await queryRunner.query(`COMMENT ON TABLE "document_series" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_document_series_key"`,
		);
		await queryRunner.query(`DROP TABLE "document_series"`);
		await queryRunner.query(
			`DROP TYPE "public"."document_series_document_type_enum"`,
		);
	}
}
