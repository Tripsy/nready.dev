/**
 * The units a numeric product attribute can be quoted in, and what it takes to compare two of them.
 *
 * A range filter is the whole reason this exists. `product_attribute` stores a bare number and the
 * definition fixes its unit, so *"between 300 and 600 ml"* is an indexed numeric comparison — but
 * only while every row under a label is quoted in the same unit. Rather than forbid the mismatch,
 * each unit declares a `dimension` and a `factor` into that dimension's base, and the attribute row
 * carries the converted figure in `value_base` alongside the number as entered. 0.5 l and 500 ml
 * both land on 500, so the filter is correct across categories that spell the unit differently.
 *
 * Conversion happens **once, on write**. Converting at read time would put arithmetic between the
 * filter and the index and cost the index scan.
 */
export const MeasureDimensionEnum = {
	VOLUME: 'volume',
	MASS: 'mass',
	LENGTH: 'length',
	AREA: 'area',
	TIME: 'time',
	POWER: 'power',
	ENERGY: 'energy',
} as const;

export type MeasureDimension =
	(typeof MeasureDimensionEnum)[keyof typeof MeasureDimensionEnum];

export const MeasureUnitEnum = {
	// Volume — base `ml`
	MILLILITRE: 'ml',
	CENTILITRE: 'cl',
	DECILITRE: 'dl',
	LITRE: 'l',
	HECTOLITRE: 'hl',
	CUBIC_METRE: 'm3',
	// Mass — base `g`
	MILLIGRAM: 'mg',
	GRAM: 'g',
	KILOGRAM: 'kg',
	TONNE: 't',
	// Length — base `mm`
	MILLIMETRE: 'mm',
	CENTIMETRE: 'cm',
	METRE: 'm',
	KILOMETRE: 'km',
	// Area — base `mm2`
	SQUARE_MILLIMETRE: 'mm2',
	SQUARE_CENTIMETRE: 'cm2',
	SQUARE_METRE: 'm2',
	// Time — base `s`
	SECOND: 's',
	MINUTE: 'min',
	HOUR: 'h',
	DAY: 'day',
	// Power — base `w`
	WATT: 'w',
	KILOWATT: 'kw',
	// Energy — base `j`
	JOULE: 'j',
	WATT_HOUR: 'wh',
	KILOWATT_HOUR: 'kwh',
} as const;

export type MeasureUnit =
	(typeof MeasureUnitEnum)[keyof typeof MeasureUnitEnum];

type MeasureUnitDefinition = {
	dimension: MeasureDimension;
	/** Multiplier into the dimension's base unit — the base unit's own is 1. */
	factor: number;
	/** How the unit renders; the key is an ASCII slug, so `m2` is not printable as-is. */
	symbol: string;
};

/**
 * Only ratio scales belong here. Temperature is the notable absence: °C to K is affine, not a
 * multiplication, so a `factor` alone cannot express it and a numeric attribute holding one has to
 * stay in a single unit. Adding a dimension is an entry in both maps and nothing else.
 */
export const MEASURE_UNITS: Record<MeasureUnit, MeasureUnitDefinition> = {
	[MeasureUnitEnum.MILLILITRE]: {
		dimension: MeasureDimensionEnum.VOLUME,
		factor: 1,
		symbol: 'ml',
	},
	[MeasureUnitEnum.CENTILITRE]: {
		dimension: MeasureDimensionEnum.VOLUME,
		factor: 10,
		symbol: 'cl',
	},
	[MeasureUnitEnum.DECILITRE]: {
		dimension: MeasureDimensionEnum.VOLUME,
		factor: 100,
		symbol: 'dl',
	},
	[MeasureUnitEnum.LITRE]: {
		dimension: MeasureDimensionEnum.VOLUME,
		factor: 1_000,
		symbol: 'l',
	},
	[MeasureUnitEnum.HECTOLITRE]: {
		dimension: MeasureDimensionEnum.VOLUME,
		factor: 100_000,
		symbol: 'hl',
	},
	[MeasureUnitEnum.CUBIC_METRE]: {
		dimension: MeasureDimensionEnum.VOLUME,
		factor: 1_000_000,
		symbol: 'm³',
	},

	[MeasureUnitEnum.MILLIGRAM]: {
		dimension: MeasureDimensionEnum.MASS,
		factor: 0.001,
		symbol: 'mg',
	},
	[MeasureUnitEnum.GRAM]: {
		dimension: MeasureDimensionEnum.MASS,
		factor: 1,
		symbol: 'g',
	},
	[MeasureUnitEnum.KILOGRAM]: {
		dimension: MeasureDimensionEnum.MASS,
		factor: 1_000,
		symbol: 'kg',
	},
	[MeasureUnitEnum.TONNE]: {
		dimension: MeasureDimensionEnum.MASS,
		factor: 1_000_000,
		symbol: 't',
	},

	[MeasureUnitEnum.MILLIMETRE]: {
		dimension: MeasureDimensionEnum.LENGTH,
		factor: 1,
		symbol: 'mm',
	},
	[MeasureUnitEnum.CENTIMETRE]: {
		dimension: MeasureDimensionEnum.LENGTH,
		factor: 10,
		symbol: 'cm',
	},
	[MeasureUnitEnum.METRE]: {
		dimension: MeasureDimensionEnum.LENGTH,
		factor: 1_000,
		symbol: 'm',
	},
	[MeasureUnitEnum.KILOMETRE]: {
		dimension: MeasureDimensionEnum.LENGTH,
		factor: 1_000_000,
		symbol: 'km',
	},

	[MeasureUnitEnum.SQUARE_MILLIMETRE]: {
		dimension: MeasureDimensionEnum.AREA,
		factor: 1,
		symbol: 'mm²',
	},
	[MeasureUnitEnum.SQUARE_CENTIMETRE]: {
		dimension: MeasureDimensionEnum.AREA,
		factor: 100,
		symbol: 'cm²',
	},
	[MeasureUnitEnum.SQUARE_METRE]: {
		dimension: MeasureDimensionEnum.AREA,
		factor: 1_000_000,
		symbol: 'm²',
	},

	[MeasureUnitEnum.SECOND]: {
		dimension: MeasureDimensionEnum.TIME,
		factor: 1,
		symbol: 's',
	},
	[MeasureUnitEnum.MINUTE]: {
		dimension: MeasureDimensionEnum.TIME,
		factor: 60,
		symbol: 'min',
	},
	[MeasureUnitEnum.HOUR]: {
		dimension: MeasureDimensionEnum.TIME,
		factor: 3_600,
		symbol: 'h',
	},
	[MeasureUnitEnum.DAY]: {
		dimension: MeasureDimensionEnum.TIME,
		factor: 86_400,
		symbol: 'day',
	},

	[MeasureUnitEnum.WATT]: {
		dimension: MeasureDimensionEnum.POWER,
		factor: 1,
		symbol: 'W',
	},
	[MeasureUnitEnum.KILOWATT]: {
		dimension: MeasureDimensionEnum.POWER,
		factor: 1_000,
		symbol: 'kW',
	},

	// Base is the joule rather than the watt-hour, so every factor stays a whole number
	[MeasureUnitEnum.JOULE]: {
		dimension: MeasureDimensionEnum.ENERGY,
		factor: 1,
		symbol: 'J',
	},
	[MeasureUnitEnum.WATT_HOUR]: {
		dimension: MeasureDimensionEnum.ENERGY,
		factor: 3_600,
		symbol: 'Wh',
	},
	[MeasureUnitEnum.KILOWATT_HOUR]: {
		dimension: MeasureDimensionEnum.ENERGY,
		factor: 3_600_000,
		symbol: 'kWh',
	},
};

/**
 * Converts a value quoted in `unit` into its dimension's base unit — what `value_base` stores.
 *
 * A unitless number passes through unchanged, so every numeric attribute has a `value_base` and the
 * facet index is the only path a range filter needs.
 *
 * Rounded to six decimals, the scale of the column it feeds. Binary floating point makes
 * `0.29 * 100` come out as `28.999999999999996`, so 0.29 dl and 29 ml — the same quantity — would
 * be stored as two different base figures and an equality filter would separate them.
 */
export const toBaseUnit = (value: number, unit: MeasureUnit | null): number => {
	if (unit === null) {
		return value;
	}

	return Number((value * MEASURE_UNITS[unit].factor).toFixed(6));
};

/**
 * Whether two units measure the same kind of thing, and so whether their base figures are
 * comparable. A filter spanning several categories has to check this before it trusts a range.
 */
export const isSameDimension = (
	left: MeasureUnit,
	right: MeasureUnit,
): boolean => MEASURE_UNITS[left].dimension === MEASURE_UNITS[right].dimension;
