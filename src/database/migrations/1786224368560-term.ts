import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Term1786224368560 implements MigrationInterface {
	name = 'Term1786224368560';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_cdc3f155737b763c298ab080f84"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37"`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_term_unique" ON "term"  ("type", "language", "value") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_cdc3f155737b763c298ab080f84" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844" FOREIGN KEY ("attribute_label_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d" FOREIGN KEY ("attribute_value_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_cdc3f155737b763c298ab080f84"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_unique"`);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d" FOREIGN KEY ("attribute_value_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844" FOREIGN KEY ("attribute_label_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_cdc3f155737b763c298ab080f84" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
	}
}
