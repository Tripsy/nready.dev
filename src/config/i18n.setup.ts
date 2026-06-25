import * as fs from 'node:fs';
import path from 'node:path';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { LanguageDetector } from 'i18next-http-middleware';
import { Configuration } from '@/config/settings.config';
import { buildSrcPath, listDirectories } from '@/helpers';
import { getSystemLogger } from '@/providers/logger.provider';

async function getFeatureNamespaces(): Promise<string[]> {
	const featuresFolder = Configuration.get<string>(
		'folder.features',
	) as string;
	const featuresPath = buildSrcPath(featuresFolder);
	const features = listDirectories(featuresPath);

	const foldersWithLocales = await Promise.all(
		features.map(async (n) => {
			try {
				await fs.promises.access(
					path.join(
						featuresPath,
						n,
						'locales',
						`${Configuration.language()}.json`,
					),
				);

				return n;
			} catch {
				return null;
			}
		}),
	);

	return foldersWithLocales.filter((name): name is string => name !== null);
}

async function getNamespaces(): Promise<string[]> {
	const featureNamespaces = await getFeatureNamespaces();

	return ['shared', ...featureNamespaces];
}

export async function initializeI18next() {
	const namespaces = await getNamespaces();

	await i18next
		.use(Backend)
		.use(LanguageDetector)
		.init({
			fallbackLng: 'en',
			supportedLngs: Configuration.get('language.supported') as string[], // List of supported languages
			interpolation: {
				escapeValue: false, // Disable escaping for HTML (if needed)
			},
			saveMissing: false, // Disable saving missing translations
			ns: namespaces,
			backend: {
				loadPath: (_lng: string, ns: string) => {
					if (ns === 'shared') {
						return buildSrcPath(
							Configuration.get('folder.shared') as string,
							'/locales/{{lng}}.json',
						);
					}

					return buildSrcPath(
						Configuration.get('folder.features') as string,
						`/${ns}/locales/{{lng}}.json`,
					);
				},
			},
			detection: {
				order: ['header', 'cookie', 'querystring'], // Detect language from headers, cookies, or query parameters
			},
		});

	getSystemLogger().debug(
		`i18next initialized with namespaces: ${namespaces.join(', ')}`,
	);
}

/**
 * Translate a key with optional replacements.
 * The key should be in the format `namespace.key`.
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

	const [ns, ...rest] = key.split('.'); // Extract namespace
	const newKey = rest.join('.'); // Reconstruct key without the namespace

	if (!i18next.options.ns?.includes(ns)) {
		if (fallback) {
			return fallback;
		}

		getSystemLogger().warn(`Unknown namespace: ${ns}`);

		return key;
	}

	return i18next.t(newKey, { ns, ...replacements });
};
