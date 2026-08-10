/**
 * Version parsing and range matching for the feature installer.
 *
 * Deliberately not the `semver` package. The manifest grammar is narrow — one constraint per
 * dependency, over plain `major.minor.patch` releases, with no pre-release tags, build metadata or
 * unions — and this is a boilerplate other projects are copied from, so a dependency carried into
 * every one of them has to earn its place. Roughly sixty lines does not.
 */

export type Version = [number, number, number];

export type Dependency = {
	name: string;
	/** `null` means any version satisfies it. */
	range: string | null;
};

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
const RANGE_PATTERN = /^(\^|~|>=|<=|>|<|=)?\s*(\d+\.\d+\.\d+)$/;

export function parseVersion(value: string): Version {
	const match = VERSION_PATTERN.exec(value.trim());

	if (!match) {
		throw new Error(
			`Invalid version "${value}"; expected "major.minor.patch"`,
		);
	}

	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function compareVersions(a: string, b: string): -1 | 0 | 1 {
	const left = parseVersion(a);
	const right = parseVersion(b);

	for (let index = 0; index < 3; index++) {
		if (left[index] !== right[index]) {
			return left[index] < right[index] ? -1 : 1;
		}
	}

	return 0;
}

/**
 * Splits a manifest dependency entry into its name and its optional range: `brand` (any version),
 * `vendor@^2.0.0`, `order@>=1.2.0`.
 *
 * Reads from the last `@` so a scoped name would survive, and treats a leading `@` as part of the
 * name rather than an empty one.
 */
export function parseDependency(entry: string): Dependency {
	const separator = entry.lastIndexOf('@');

	if (separator <= 0) {
		return { name: entry.trim(), range: null };
	}

	return {
		name: entry.slice(0, separator).trim(),
		range: entry.slice(separator + 1).trim(),
	};
}

export function formatDependency(dependency: Dependency): string {
	return dependency.range
		? `${dependency.name}@${dependency.range}`
		: dependency.name;
}

export function satisfiesRange(version: string, range: string | null): boolean {
	if (range === null || range === '*') {
		return true;
	}

	const match = RANGE_PATTERN.exec(range);

	if (!match) {
		throw new Error(
			`Invalid version range "${range}"; expected an optional operator (^ ~ >= <= > < =) followed by "major.minor.patch"`,
		);
	}

	const operator = match[1] ?? '=';
	const target = match[2];
	const comparison = compareVersions(version, target);

	switch (operator) {
		case '=':
			return comparison === 0;
		case '>':
			return comparison === 1;
		case '>=':
			return comparison >= 0;
		case '<':
			return comparison === -1;
		case '<=':
			return comparison <= 0;
		case '^': {
			if (comparison === -1) {
				return false;
			}

			const [versionMajor, versionMinor] = parseVersion(version);
			const [targetMajor, targetMinor] = parseVersion(target);

			// A 0.x release is allowed to break on every minor, so `^` pins one level deeper there
			return targetMajor === 0
				? versionMajor === 0 && versionMinor === targetMinor
				: versionMajor === targetMajor;
		}
		case '~': {
			if (comparison === -1) {
				return false;
			}

			const [versionMajor, versionMinor] = parseVersion(version);
			const [targetMajor, targetMinor] = parseVersion(target);

			return versionMajor === targetMajor && versionMinor === targetMinor;
		}
		default:
			throw new Error(`Unsupported version range operator "${operator}"`);
	}
}
