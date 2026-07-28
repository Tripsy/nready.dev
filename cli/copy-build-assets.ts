import fs from 'node:fs';
import path from 'node:path';

/**
 * Copies everything under `src/` that `tsc` does not emit into the build output.
 *
 * The app reads several kinds of file straight off disk at runtime, all resolved through
 * `buildSrcPath()` (i.e. `<cwd>/src/...`): Nunjucks email layouts in `src/templates`, and
 * the per-feature `locales/en.json` files that `message.setup.ts` loads by namespace.
 * `tsc` only emits `.ts`, so without this step the build boots and then fails on the first
 * email render or `lang()` lookup.
 *
 * The filter is written as "copy anything that is not TypeScript" rather than an allow-list
 * of `.html`/`.json`, so a new asset type does not silently go missing from production.
 */

const SOURCE_DIR = path.join(process.cwd(), 'src');
const TARGET_DIR = path.join(process.cwd(), 'dist', 'src');

// Mirrors the `exclude` in tsconfig.build.json — test fixtures are not shipped.
const EXCLUDED_DIRS = new Set(['tests']);

let copiedCount = 0;

fs.cpSync(SOURCE_DIR, TARGET_DIR, {
	recursive: true,
	filter: (source: string): boolean => {
		if (fs.statSync(source).isDirectory()) {
			return !EXCLUDED_DIRS.has(path.basename(source));
		}

		if (source.endsWith('.ts')) {
			return false;
		}

		copiedCount++;

		return true;
	},
});

console.log(`Copied ${copiedCount} asset(s) into dist/src`);
