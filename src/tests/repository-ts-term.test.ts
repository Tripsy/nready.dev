import { expect } from '@jest/globals';
import type { Repository } from 'typeorm';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

/**
 * `prepareTsTerm` is the only thing standing between a search box and `to_tsquery`, which
 * answers a syntax *error* — not an empty result — for input carrying its operators. These
 * cases are the ones that reached Postgres unescaped before.
 */
class ProbeQuery extends RepositoryAbstract<{ id: number }> {
	constructor() {
		// The base constructor only needs `createQueryBuilder` to exist; nothing here
		// touches the builder
		super(
			{
				createQueryBuilder: () => ({}),
			} as unknown as Repository<{ id: number }>,
			'probe',
		);
	}

	public prepare(term: string): string {
		return this.prepareTsTerm(term);
	}
}

const query = new ProbeQuery();

describe('RepositoryAbstract.prepareTsTerm', () => {
	it('joins words with the AND operator', () => {
		expect(query.prepare('New York')).toBe('new & york');
	});

	it('collapses repeated and surrounding whitespace', () => {
		expect(query.prepare('  new   york  ')).toBe('new & york');
	});

	it.each([
		['foo(bar', 'foo & bar'],
		['foo)bar', 'foo & bar'],
		['foo|bar', 'foo & bar'],
		['foo&bar', 'foo & bar'],
		['foo!bar', 'foo & bar'],
		['foo:bar', 'foo & bar'],
		['foo<->bar', 'foo & bar'],
		['foo\\', 'foo'],
		["o'brien", 'o & brien'],
	])('strips tsquery operators from %s', (input, expected) => {
		expect(query.prepare(input)).toBe(expected);
	});

	it('keeps letters outside the ASCII range', () => {
		expect(query.prepare('Timișoara Cluj')).toBe('timișoara & cluj');
	});

	it('keeps digits', () => {
		expect(query.prepare('route 66')).toBe('route & 66');
	});

	it('returns an empty string when nothing searchable survives', () => {
		// The caller must then skip the filter entirely: `to_tsquery('simple', ':*')` is
		// itself a syntax error
		expect(query.prepare('+++')).toBe('');
		expect(query.prepare('()')).toBe('');
	});
});
