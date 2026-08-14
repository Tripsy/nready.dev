import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops `deleted_at` from the remaining `*_content` tables, matching `image_content` and
 * `term_content`.
 *
 * A translation is never deleted on its own: the only write these tables get is an upsert from
 * `saveContent`, and no repository exposes a delete. The row dies with its parent through the
 * FK cascade, so the column only ever held NULL while forcing every unique index to be partial
 * and every upsert to repeat the predicate as its conflict arbiter.
 *
 * The unique indexes come back without that predicate, which makes them stricter: a
 * soft-deleted duplicate of a live row used to sit outside the index and would now collide.
 * There are none — this is verified as all-NULL before the migration is written — and a
 * database that does hold one fails loudly on `CREATE UNIQUE INDEX` rather than losing a row.
 */
export class ContentTablesNoSoftDelete1786910000000
	implements MigrationInterface
{
	name = 'ContentTablesNoSoftDelete1786910000000';

	/** table -> the indexes whose predicate depends on `deleted_at`, minus the deleted_at one */
	private static readonly INDEXES: Record<string, [string, string][]> = {
		brand_content: [
			['IDX_brand_content_unique_per_lang', '"brand_id", "language"'],
		],
		category_content: [
			[
				'IDX_category_content_category_id_language',
				'"category_id", "language"',
			],
			[
				'IDX_category_content_slug_language',
				'"type", "slug", "language"',
			],
		],
		place_content: [
			['IDX_place_content_unique_per_lang', '"place_id", "language"'],
		],
		article_content: [
			['IDX_article_content_unique_per_lang', '"article_id", "language"'],
			['IDX_article_content_slug_lang', '"slug", "language"'],
		],
		product_content: [
			['IDX_product_content_unique_per_lang', '"product_id", "language"'],
			['IDX_product_content_slug_lang', '"slug", "language"'],
		],
	};

	public async up(queryRunner: QueryRunner): Promise<void> {
		for (const [table, indexes] of Object.entries(
			ContentTablesNoSoftDelete1786910000000.INDEXES,
		)) {
			/*
			 * Dropped explicitly before the column rather than left to Postgres: an index whose
			 * predicate depends on the column goes with it either way, and spelling it out keeps
			 * the order the same as the `down` that rebuilds them.
			 */
			for (const [name] of indexes) {
				await queryRunner.query(`DROP INDEX "public"."${name}"`);
			}

			await queryRunner.query(
				`DROP INDEX "public"."IDX_${table}_deleted_at"`,
			);

			await queryRunner.query(
				`ALTER TABLE "${table}" DROP COLUMN "deleted_at"`,
			);

			for (const [name, columns] of indexes) {
				await queryRunner.query(
					`CREATE UNIQUE INDEX "${name}" ON "${table}"  (${columns})`,
				);
			}
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		for (const [table, indexes] of Object.entries(
			ContentTablesNoSoftDelete1786910000000.INDEXES,
		)) {
			for (const [name] of indexes) {
				await queryRunner.query(`DROP INDEX "public"."${name}"`);
			}

			await queryRunner.query(
				`ALTER TABLE "${table}" ADD "deleted_at" TIMESTAMP`,
			);

			for (const [name, columns] of indexes) {
				await queryRunner.query(
					`CREATE UNIQUE INDEX "${name}" ON "${table}"  (${columns}) WHERE deleted_at IS NULL`,
				);
			}

			await queryRunner.query(
				`CREATE INDEX "IDX_${table}_deleted_at" ON "${table}"  ("deleted_at") WHERE deleted_at IS NULL`,
			);
		}
	}
}
