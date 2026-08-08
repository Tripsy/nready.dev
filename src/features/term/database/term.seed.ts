import {
	isDirectRun,
	type SeedDefinition,
	type SeedSummary,
	topUp,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import TermEntity, {
	type TermType,
	TermTypeEnum,
} from '@/features/term/term.entity';

type TermRow = {
	type: TermType;
	language: string;
	value: string;
};

/**
 * The vocabulary is fixed rather than generated: a taxonomy only reads as real if the terms
 * mean something, and `attribute_label` / `attribute_value` have to pair up for
 * `product_attribute` to be seeded on top of them later.
 *
 * Every `value` is distinct across the whole list — `topUp` keys on a single column, so two
 * rows sharing a value would make the second look already-present and never be inserted.
 * The database's own key is the (type, language, value) triple, which is wider.
 */
const TERMS: readonly TermRow[] = [
	// Tags — English
	{ type: TermTypeEnum.TAG, language: 'en', value: 'Summer' },
	{ type: TermTypeEnum.TAG, language: 'en', value: 'Winter' },
	{ type: TermTypeEnum.TAG, language: 'en', value: 'New Arrival' },
	{ type: TermTypeEnum.TAG, language: 'en', value: 'Best Seller' },
	{ type: TermTypeEnum.TAG, language: 'en', value: 'Clearance' },
	{ type: TermTypeEnum.TAG, language: 'en', value: 'Limited Edition' },
	{ type: TermTypeEnum.TAG, language: 'en', value: 'Eco Friendly' },

	// Tags — Romanian, so the language filter has something to separate
	{ type: TermTypeEnum.TAG, language: 'ro', value: 'Vara' },
	{ type: TermTypeEnum.TAG, language: 'ro', value: 'Iarna' },
	{ type: TermTypeEnum.TAG, language: 'ro', value: 'Noutati' },

	// Attribute labels
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, language: 'en', value: 'Color' },
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, language: 'en', value: 'Size' },
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, language: 'en', value: 'Material' },
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, language: 'en', value: 'Capacity' },
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, language: 'ro', value: 'Culoare' },
	{ type: TermTypeEnum.ATTRIBUTE_LABEL, language: 'ro', value: 'Marime' },

	// Attribute values — colors
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: 'Red' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: 'Blue' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: 'Green' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: 'Black' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'ro', value: 'Rosu' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'ro', value: 'Albastru' },

	// Attribute values — sizes and materials
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: 'Small' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: 'Medium' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: 'Large' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: 'Cotton' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: 'Leather' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: '500 ml' },
	{ type: TermTypeEnum.ATTRIBUTE_VALUE, language: 'en', value: '1 litre' },

	// Free text
	{ type: TermTypeEnum.TEXT, language: 'en', value: 'Free shipping' },
	{
		type: TermTypeEnum.TEXT,
		language: 'en',
		value: 'Returns within 30 days',
	},
	{ type: TermTypeEnum.TEXT, language: 'ro', value: 'Transport gratuit' },
];

const TARGET = TERMS.length;

export const termSeed: SeedDefinition = {
	name: 'term',
	run: async ({ manager }): Promise<SeedSummary> =>
		topUp<TermRow>({
			entity: 'term',
			target: TARGET,
			manager,
			entityClass: TermEntity,
			keyColumn: 'value',
			buildRow: (index) => TERMS[index],
		}),
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(termSeed);
}
