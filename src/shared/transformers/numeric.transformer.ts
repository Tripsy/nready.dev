import type { ValueTransformer } from 'typeorm';

/**
 * Reads a Postgres `numeric`/`decimal` column back as a JS number.
 *
 * node-postgres hands `numeric` over as a string, because the type is wider than a float64
 * and the driver refuses to lose digits on the way out. TypeORM passes that through, so a
 * `decimal` column arrives as `"15.00"` unless a transformer says otherwise — which turns
 * every arithmetic use into a silent string concatenation and every comparison into a
 * lexicographic one (`"9" > "15"`).
 *
 * Safe for the money-shaped columns it is used on: `precision: 12, scale: 2` needs 12
 * significant digits and float64 carries ~15, so the round trip is exact. It is NOT safe on
 * a wider numeric — past ~15 digits `parseFloat` starts rounding, and the string is the only
 * lossless form. Check the column's precision before reaching for this.
 */
export const numericTransformer: ValueTransformer = {
	// Postgres accepts a JS number for `numeric`, so the write direction is a pass-through.
	to: (value: number | null) => value,
	from: (value: string | null) => (value === null ? null : Number(value)),
};
