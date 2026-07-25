import * as fs from 'node:fs';
import path from 'node:path';
import { Configuration } from '@/config/settings.config';
import {
	buildSrcPath,
	getErrorMessage,
	getObjectValue,
	listDirectories,
	type ObjectValue,
	replaceVars,
} from '@/helpers';

/**
 * API-facing text — response messages and validation errors — is English-only by design.
 *
 * The app is still multi-language, but at the *content* level: `res.locals.language`
 * (set by `language.middleware.ts`) drives brand/address/place/template content and the
 * language an email is rendered in. That content lives in the database, not here.
 *
 * Because this module therefore only ever reads `en.json`, i18next earned nothing: no
 * language detection, no per-language backend loading, no fallback chain. What remains is
 * a dotted-key lookup plus `{{var}}` interpolation, which `getObjectValue`/`replaceVars`
 * already provide — so the i18next/​fs-backend/​http-middleware trio was dropped.
 *
 * Diagnostics here go to `console`, not `getSystemLogger()`, on purpose. The logger's email
 * destination resolves an email transport, and those transports call `lang()` — routing
 * this module's own warnings back through the logger closes that loop. This module sits
 * below the logger in the dependency order and must stay there.
 */

const LANGUAGE = 'en';
const LOCALES_FOLDER = 'locales';
const SHARED_NAMESPACE = 'shared';

type MessageResource = { [key: string]: ObjectValue };

/** Namespace (`shared` or a feature folder name) -> parsed `en.json`. */
const messages: Record<string, MessageResource> = {};

/**
 * Reads one namespace file.
 *
 * A missing file is the normal case — most features ship no locale file — so it resolves
 * to `null`. Malformed JSON is not: it would silently degrade every message in that
 * feature to a raw key, so it throws and fails the boot instead.
 */
async function readNamespace(
	filePath: string,
): Promise<MessageResource | null> {
	let content: string;

	try {
		content = await fs.promises.readFile(filePath, 'utf-8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return null;
		}

		throw error;
	}

	try {
		return JSON.parse(content) as MessageResource;
	} catch (error) {
		throw new Error(
			`Invalid locale file "${filePath}": ${getErrorMessage(error)}`,
		);
	}
}

/**
 * Loads every `en.json` (shared + per feature) into memory. Called once from `bootstrap`.
 */
export async function initializeMessages(): Promise<void> {
	const featuresPath = buildSrcPath(
		Configuration.get('folder.features') as string,
	);

	const namespaceFiles: ReadonlyArray<readonly [string, string]> = [
		[
			SHARED_NAMESPACE,
			buildSrcPath(
				Configuration.get('folder.shared') as string,
				LOCALES_FOLDER,
				`${LANGUAGE}.json`,
			),
		],
		...listDirectories(featuresPath).map(
			(feature) =>
				[
					feature,
					path.join(
						featuresPath,
						feature,
						LOCALES_FOLDER,
						`${LANGUAGE}.json`,
					),
				] as const,
		),
	];

	const loaded = await Promise.all(
		namespaceFiles.map(
			async ([namespace, filePath]) =>
				[namespace, await readNamespace(filePath)] as const,
		),
	);

	for (const [namespace, resource] of loaded) {
		if (resource) {
			messages[namespace] = resource;
		}
	}

	if (Configuration.get('app.debug')) {
		console.debug(
			`Messages loaded for namespaces: ${Object.keys(messages).join(', ')}`,
		);
	}
}

type MessageLookup =
	| { found: true; value: string }
	| { found: false; reason: 'unknown_namespace' | 'missing_key' };

function lookup(key: string): MessageLookup {
	const [namespace, ...rest] = key.split('.');
	const resource = messages[namespace];

	if (!resource) {
		return { found: false, reason: 'unknown_namespace' };
	}

	const value = getObjectValue(resource, rest.join('.'));

	if (typeof value !== 'string') {
		return { found: false, reason: 'missing_key' };
	}

	return { found: true, value };
}

/**
 * Whether a key resolves to a message. Used by `cli/check-message-keys.ts` to fail the
 * build on a dangling key; unlike `lang()` it has no test-environment short-circuit, so
 * the check behaves the same in every environment.
 */
export function hasMessage(key: string): boolean {
	return key.includes('.') && lookup(key).found;
}

/**
 * Resolve a message key to its English text, with optional `{{var}}` replacements.
 * The key must be in the format `namespace.key` (eg: `vehicle.error.not_found`).
 *
 * Returns `fallback` when given and the key cannot be resolved; otherwise returns the key
 * itself, so a missing entry surfaces in the response instead of rendering as empty text.
 */
export const lang = (
	key: string,
	replacements: Record<string, string> = {},
	fallback?: string,
): string => {
	if (Configuration.isEnvironment('test')) {
		return key;
	}

	if (!key.includes('.')) {
		throw Error(
			`Invalid translation key format: "${key}". Expected format: "namespace.key".`,
		);
	}

	const result = lookup(key);

	if (!result.found) {
		if (fallback) {
			return fallback;
		}

		console.warn(
			result.reason === 'unknown_namespace'
				? `Unknown message namespace: ${key.split('.')[0]}`
				: `Missing message for key: ${key}`,
		);

		return key;
	}

	const value = result.value;

	return replaceVars(value, replacements);
};
