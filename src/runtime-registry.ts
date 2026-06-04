import type {
	EditorConfigSchemaContribution,
	JSONSchemaLike,
	RuntimeRegistry,
	RuntimeRegistryEntry,
} from '@8f4e/editor';
import { getCodeBuffer, getMemory } from './compiler-callback';

/**
 * Creates a lazy runtime registry entry that defers loading the runtime implementation and schema
 * until the runtime is first selected. Uses a cached Promise singleton for idempotent, race-safe
 * loading. Once loaded, the full schema replaces the stub and config is revalidated.
 */
function createLazyRuntimeEntry(
	id: string,
	editorConfigSchema: EditorConfigSchemaContribution,
	loader: () => Promise<RuntimeRegistryEntry>
): RuntimeRegistryEntry {
	let loadPromise: Promise<RuntimeRegistryEntry> | null = null;

	// Minimal permissive stub schema used until the real schema is loaded.
	// No additionalProperties constraint so valid contributed properties are not rejected before the full schema arrives.
	const stubSchema: JSONSchemaLike = {
		type: 'object',
	};

	const entry: RuntimeRegistryEntry = {
		id,
		editorConfigSchema: {
			...editorConfigSchema,
			schema: stubSchema,
		},
		factory: (store, events) => {
			let destroyed = false;
			let destroy: (() => void) | null = null;

			if (!loadPromise) {
				loadPromise = loader();
			}

			loadPromise.then(loadedEntry => {
				entry.editorConfigSchema = loadedEntry.editorConfigSchema;
				entry.getEnvConstants = loadedEntry.getEnvConstants;
				store.set('runtimeRegistry', { ...store.getState().runtimeRegistry });
				if (!destroyed) {
					destroy = loadedEntry.factory(store, events);
				}
			});

			return () => {
				destroyed = true;
				if (destroy) {
					destroy();
				}
			};
		},
	};

	return entry;
}

/**
 * Runtime registry for the application.
 * Maps runtime IDs to their editor-config schema contributions and factory functions.
 * Runtimes are lazy-loaded on first selection. Each runtime starts with a minimal stub schema
 * and replaces it with the full schema after loading.
 */
export const runtimeRegistry: RuntimeRegistry = {
	WebWorkerRuntime: createLazyRuntimeEntry(
		'WebWorkerRuntime',
		{ root: 'workerRuntime', defaults: { sampleRate: 50 }, schema: { type: 'object' } },
		async () => {
			const [{ createWebWorkerRuntimeDef }, { default: WebWorkerRuntime }] = await Promise.all([
				import('@8f4e/runtime-web-worker/runtime-def'),
				import('@8f4e/runtime-web-worker?worker'),
			]);
			return createWebWorkerRuntimeDef(getCodeBuffer, getMemory, WebWorkerRuntime);
		}
	),

	MainThreadRuntime: createLazyRuntimeEntry(
		'MainThreadRuntime',
		{ root: 'mainThreadRuntime', defaults: { sampleRate: 50 }, schema: { type: 'object' } },
		async () => {
			const { createMainThreadRuntimeDef } = await import('@8f4e/runtime-main-thread/runtime-def');
			return createMainThreadRuntimeDef(getCodeBuffer, getMemory);
		}
	),

	AudioWorkletRuntime: createLazyRuntimeEntry(
		'AudioWorkletRuntime',
		{ root: 'audioRuntime', defaults: { sampleRate: 48000 }, schema: { type: 'object' } },
		async () => {
			const [{ createAudioWorkletRuntimeDef }, { default: audioWorkletUrl }] = await Promise.all([
				import('@8f4e/runtime-audio-worklet/runtime-def'),
				import('@8f4e/runtime-audio-worklet/worklet?url'),
			]);
			return createAudioWorkletRuntimeDef(getCodeBuffer, getMemory, audioWorkletUrl);
		}
	),
};
