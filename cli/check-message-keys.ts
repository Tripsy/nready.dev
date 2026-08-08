import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { hasMessage, initializeMessages } from '../src/config/message.setup';

/**
 * Fails on any `lang('namespace.key')` in `src/` whose locale entry does not exist.
 *
 * A dangling key is invisible at runtime: `lang()` returns the key itself, so the client
 * receives `user.error.not_found` where a sentence belongs and nothing throws. Three of
 * these had accumulated before this check existed.
 *
 * Static single-quoted keys only. Keys built at runtime (template literals, variables,
 * `BaseValidator.getMessage()` which prefixes the entity name) can't be resolved by
 * reading source, so they are counted and reported as unchecked rather than guessed at.
 *
 * Usage: pnpm run messages:check
 */

const SRC_PATH = path.join(process.cwd(), 'src');

/** `lang('some.key'` — the opening of a call whose first argument is a literal. */
const STATIC_KEY = /\blang\(\s*'([^']+)'/g;
/** `lang(` not followed by a quote: a runtime-built key. */
const DYNAMIC_CALL = /\blang\(\s*(?!['"])[^)\s]/g;

type Finding = {
	key: string;
	file: string;
	line: number;
};

async function listTypeScriptFiles(directory: string): Promise<string[]> {
	const entries = await fs.readdir(directory, { withFileTypes: true });

	const nested = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				return listTypeScriptFiles(entryPath);
			}

			return entry.isFile() && entry.name.endsWith('.ts')
				? [entryPath]
				: [];
		}),
	);

	return nested.flat();
}

async function main(): Promise<void> {
	await initializeMessages();

	const files = await listTypeScriptFiles(SRC_PATH);

	const findings: Finding[] = [];
	const checkedKeys = new Set<string>();

	let dynamicCount = 0;

	for (const file of files) {
		const content = await fs.readFile(file, 'utf8');
		const lines = content.split('\n');

		dynamicCount += content.match(DYNAMIC_CALL)?.length ?? 0;

		lines.forEach((line, index) => {
			for (const match of line.matchAll(STATIC_KEY)) {
				const key = match[1];

				checkedKeys.add(key);

				if (!hasMessage(key)) {
					findings.push({
						key,
						file: path.relative(process.cwd(), file),
						line: index + 1,
					});
				}
			}
		});
	}

	console.log(
		`Checked ${checkedKeys.size} distinct lang() keys across ${files.length} files` +
			(dynamicCount > 0
				? ` (${dynamicCount} runtime-built call(s) not checked)`
				: ''),
	);

	if (findings.length === 0) {
		console.log('All message keys resolve.');

		return;
	}

	console.error(`\n${findings.length} unresolved message key(s):\n`);

	for (const finding of findings) {
		console.error(`  ${finding.file}:${finding.line}  ${finding.key}`);
	}

	console.error('');

	process.exitCode = 1;
}

main().catch((error: unknown) => {
	console.error('check-message-keys failed:', error);

	process.exitCode = 1;
});
