import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { hasMessage, initializeMessages } from '../src/config/message.setup';
import { sharedValidatorMessages } from '../src/shared/abstracts/validator.abstract';

/**
 * Fails on any message key in `src/` whose locale entry does not exist.
 *
 * A dangling key is invisible at runtime: `lang()` returns the key itself, so the client
 * receives `user.error.not_found` where a sentence belongs and nothing throws. Three of
 * these had accumulated before this check existed.
 *
 * Two sources are checked:
 *
 *   1. `lang('namespace.key')` — static single-quoted keys only. Keys built at runtime
 *      (template literals, variables) can't be resolved by reading source, so they are
 *      counted and reported as unchecked rather than guessed at.
 *   2. Every `validatorMessages` tuple in a `*.validator.ts`. `BaseValidator.getMessage()`
 *      builds its key at runtime from the entity the validator was constructed with, which
 *      puts it outside case 1 — but both halves are still static text: the tuple lists the
 *      keys, and `new XValidator('<entity>')` supplies the namespace. Pairing the two
 *      reconstructs `<entity>.validation.<key>` (or `shared.validation.<key>` for a member
 *      of `sharedValidatorMessages`, matching how `getMessage` routes it).
 *
 * Usage: pnpm run messages:check
 */

const SRC_PATH = path.join(process.cwd(), 'src');

/** `lang('some.key'` — the opening of a call whose first argument is a literal. */
const STATIC_KEY = /\blang\(\s*'([^']+)'/g;
/** `lang(` not followed by a quote: a runtime-built key. */
const DYNAMIC_CALL = /\blang\(\s*(?!['"])[^)\s]/g;

/** The `validatorMessages` tuple body. Every entity declares it as one flat list. */
const VALIDATOR_MESSAGES = /const validatorMessages\s*=\s*\[([\s\S]*?)\]/;
/** A single-quoted entry inside that tuple; the `...sharedValidatorMessages` spread is unquoted and so skipped. */
const QUOTED_ENTRY = /'([^']+)'/g;
/** `export class XValidator extends BaseValidator` — the class whose tuple this is. */
const VALIDATOR_CLASS = /class\s+(\w+)\s+extends\s+BaseValidator/g;
/** `new XValidator('entity')` — the namespace half of the key. */
const VALIDATOR_INSTANCE = /new\s+(\w+Validator)\s*\(\s*'([^']+)'/g;

type Finding = {
	key: string;
	file: string;
	line: number;
};

type SourceFile = {
	filePath: string;
	content: string;
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

/**
 * Every entity string each validator class is constructed with, gathered across the whole
 * tree because the `new` call lives in the controller or mock, not the validator file.
 *
 * A class may appear with more than one: the tuple is then checked against each, since a
 * namespace that resolves for the controller and not for the mock is still a dangling key
 * waiting for the first non-test caller.
 */
function mapValidatorEntities(files: SourceFile[]): Map<string, Set<string>> {
	const entities = new Map<string, Set<string>>();

	for (const { content } of files) {
		for (const match of content.matchAll(VALIDATOR_INSTANCE)) {
			const [, className, entity] = match;

			const known = entities.get(className) ?? new Set<string>();

			known.add(entity);
			entities.set(className, known);
		}
	}

	return entities;
}

function lineNumberOf(content: string, needle: string): number {
	const index = content.indexOf(needle);

	return index === -1 ? 1 : content.slice(0, index).split('\n').length;
}

type ValidatorScan = {
	findings: Finding[];
	checkedKeys: Set<string>;
	/** Validator classes whose entity string could not be found in any source file. */
	unresolved: string[];
};

function scanValidatorMessages(files: SourceFile[]): ValidatorScan {
	const entities = mapValidatorEntities(files);
	const shared = new Set<string>(sharedValidatorMessages);

	const findings: Finding[] = [];
	const checkedKeys = new Set<string>();
	const unresolved: string[] = [];

	for (const { filePath, content } of files) {
		if (!filePath.endsWith('.validator.ts')) {
			continue;
		}

		const tuple = content.match(VALIDATOR_MESSAGES);

		if (!tuple) {
			continue;
		}

		const messageKeys = [...tuple[1].matchAll(QUOTED_ENTRY)].map(
			(entry) => entry[1],
		);

		const line = lineNumberOf(content, 'const validatorMessages');
		const file = path.relative(process.cwd(), filePath);

		const classNames = [...content.matchAll(VALIDATOR_CLASS)].map(
			(match) => match[1],
		);

		const namespaces = new Set<string>();

		for (const className of classNames) {
			const known = entities.get(className);

			if (!known || known.size === 0) {
				unresolved.push(`${file}  ${className}`);

				continue;
			}

			for (const entity of known) {
				namespaces.add(entity);
			}
		}

		for (const messageKey of messageKeys) {
			// `getMessage` sends a member of the shared list to the shared namespace
			// regardless of the entity, so it is checked once rather than per namespace.
			const keys = shared.has(messageKey)
				? [`shared.validation.${messageKey}`]
				: [...namespaces].map(
						(entity) => `${entity}.validation.${messageKey}`,
					);

			for (const key of keys) {
				checkedKeys.add(key);

				if (!hasMessage(key)) {
					findings.push({ key, file, line });
				}
			}
		}
	}

	return { findings, checkedKeys, unresolved };
}

async function main(): Promise<void> {
	await initializeMessages();

	const filePaths = await listTypeScriptFiles(SRC_PATH);

	const files: SourceFile[] = await Promise.all(
		filePaths.map(async (filePath) => ({
			filePath,
			content: await fs.readFile(filePath, 'utf8'),
		})),
	);

	const findings: Finding[] = [];
	const checkedKeys = new Set<string>();

	let dynamicCount = 0;

	for (const { filePath, content } of files) {
		const lines = content.split('\n');

		dynamicCount += content.match(DYNAMIC_CALL)?.length ?? 0;

		lines.forEach((line, index) => {
			for (const match of line.matchAll(STATIC_KEY)) {
				const key = match[1];

				checkedKeys.add(key);

				if (!hasMessage(key)) {
					findings.push({
						key,
						file: path.relative(process.cwd(), filePath),
						line: index + 1,
					});
				}
			}
		});
	}

	const validator = scanValidatorMessages(files);

	findings.push(...validator.findings);

	console.log(
		`Checked ${checkedKeys.size} distinct lang() keys across ${files.length} files` +
			(dynamicCount > 0
				? ` (${dynamicCount} runtime-built call(s) not checked)`
				: ''),
	);

	console.log(
		`Checked ${validator.checkedKeys.size} distinct validator message key(s)` +
			(validator.unresolved.length > 0
				? ` (${validator.unresolved.length} validator class(es) with no entity found)`
				: ''),
	);

	for (const entry of validator.unresolved) {
		console.warn(`  no 'new XValidator(...)' call found for  ${entry}`);
	}

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
