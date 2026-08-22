import {
	isDirectRun,
	type SeedDefinition,
	type SeedSummary,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import TermEntity, {
	type TermType,
	TermTypeEnum,
} from '@/features/term/term.entity';
import TermContentEntity from '@/features/term/term-content.entity';

type TermRow = {
	type: TermType;
	/** The English wording, and the key this seed re-runs against. */
	en: string;
	/** Omitted where no translation exists yet — the reader falls back to `en`. */
	ro?: string;
};

/**
 * The vocabulary is fixed rather than generated: a taxonomy only reads as real if the terms
 * mean something, and `attribute_label` / `attribute_value` have to pair up for
 * `product_attribute` to be seeded on top of them later.
 *
 * One entry is one term across every language, which is the whole point of the shape — a
 * product pointing at "Color" renders as "Culoare" in Romanian rather than pinning itself to
 * whichever row was picked at write time.
 *
 * `type` + `en` is the key this seed matches on, so no two entries may share that pair.
 */
const TERMS: readonly TermRow[] = [
	// Tags
	{ type: TermTypeEnum.TAG, en: 'Summer', ro: 'Vara' },
	{ type: TermTypeEnum.TAG, en: 'Winter', ro: 'Iarna' },
	{ type: TermTypeEnum.TAG, en: 'New Arrival', ro: 'Noutati' },
	{ type: TermTypeEnum.TAG, en: 'Best Seller', ro: 'Cel mai vandut' },
	{ type: TermTypeEnum.TAG, en: 'Clearance', ro: 'Lichidare' },
	{ type: TermTypeEnum.TAG, en: 'Limited Edition', ro: 'Editie limitata' },
	{ type: TermTypeEnum.TAG, en: 'Eco Friendly', ro: 'Ecologic' },

	// Attribute labels
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, en: 'Color', ro: 'Culoare' },
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, en: 'Size', ro: 'Marime' },
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, en: 'Material', ro: 'Material' },
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, en: 'Capacity', ro: 'Capacitate' },

	// Attribute values — colors
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: 'Red', ro: 'Rosu' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: 'Blue', ro: 'Albastru' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: 'Green', ro: 'Verde' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: 'Black', ro: 'Negru' },

	// Attribute values — sizes and materials
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: 'Small', ro: 'Mic' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: 'Medium', ro: 'Mediu' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: 'Large', ro: 'Mare' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: 'Cotton', ro: 'Bumbac' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: 'Leather', ro: 'Piele' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: '500 ml' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, en: '1 litre', ro: '1 litru' },

	// Free text
	{ type: TermTypeEnum.TEXT, en: 'Free shipping', ro: 'Transport gratuit' },
	{
		type: TermTypeEnum.TEXT,
		en: 'Returns within 30 days',
		ro: 'Retur in 30 de zile',
	},
];

/**
 * Terms are stored lower-cased, the same rule `TermValidator` applies to every write. The
 * literals above keep their natural capitalisation for readability, so both the rows written
 * here and the keys re-runs match on have to go through this — comparing a raw literal against
 * a stored value would miss every existing term and insert the whole set again.
 */
const normalizeTermValue = (value: string): string =>
	value.trim().toLowerCase();

export const termSeed: SeedDefinition = {
	name: 'term',
	run: async ({ manager }): Promise<SeedSummary> => {
		const termRepository = manager.getRepository(TermEntity);
		const contentRepository = manager.getRepository(TermContentEntity);

		/*
		 * The term itself carries nothing to match on, so re-runs are keyed on the English
		 * wording of the existing contents joined back to their term's type.
		 */
		const existingContents = await contentRepository.find({
			select: { term_id: true, language: true, value: true },
			where: { language: 'en' },
			withDeleted: true,
			relations: { term: true },
		});

		const idByKey = new Map<string, number>(
			existingContents
				.filter((content) => content.term)
				.map((content) => [
					`${content.term.type}:${normalizeTermValue(content.value)}`,
					content.term_id,
				]),
		);

		const pending = TERMS.filter(
			(row) => !idByKey.has(`${row.type}:${normalizeTermValue(row.en)}`),
		);

		for (const row of pending) {
			const term = await termRepository.save(
				termRepository.create({ type: row.type }),
			);

			const contents = [
				contentRepository.create({
					term_id: term.id,
					language: 'en',
					value: normalizeTermValue(row.en),
				}),
			];

			if (row.ro) {
				contents.push(
					contentRepository.create({
						term_id: term.id,
						language: 'ro',
						value: normalizeTermValue(row.ro),
					}),
				);
			}

			await contentRepository.save(contents);

			idByKey.set(`${row.type}:${normalizeTermValue(row.en)}`, term.id);
		}

		return {
			entity: 'term',
			alreadyPresent: TERMS.length - pending.length,
			inserted: pending.length,
			target: TERMS.length,
			tableTotal: idByKey.size,
		};
	},
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(termSeed);
}
