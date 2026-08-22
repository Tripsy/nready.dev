import { runFeatureModules } from '@/config/feature-modules.setup';

/**
 * Registers every `*.listener.{ts|js}` — one per feature, plus the shared ones in
 * `src/shared/listeners` — on the emitter in `event.config.ts`.
 *
 * A listener reacts to something that already happened. A feature that instead has to *be
 * known* before the first request — a resolver a shared registry asks for an answer — ships a
 * `*.bootstrap.{ts|js}` file instead; see `bootstrap.setup.ts`.
 */
export async function setupListeners(): Promise<void> {
	return runFeatureModules({
		fileSuffix: 'listener',
		sharedFolder: 'listeners',
		label: 'Listeners',
	});
}
