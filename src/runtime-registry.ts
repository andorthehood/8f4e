import { createWebWorkerLogicRuntimeDef } from '@8f4e/runtime-web-worker-logic/runtime-def';
import WebWorkerLogicRuntime from '@8f4e/runtime-web-worker-logic?worker';

import { getCodeBuffer, getMemory } from './compiler-callback';

import type { RuntimeRegistry, RuntimeRegistryEntry, JSONSchemaLike } from '@8f4e/editor';

/**
 * Default runtime ID for the application.
 * This is used as the fallback when no runtime is specified or when an unknown runtime is requested.
 */
export const DEFAULT_RUNTIME_ID = 'WebWorkerLogicRuntime';

/**
 * Creates a lazy runtime registry entry that defers loading the runtime implementation and schema
 * until the runtime is first selected. Uses a cached Promise singleton for idempotent, race-safe
 * loading. Once loaded, the full schema replaces the stub and config is revalidated.
 */
function createLazyRuntimeEntry(
	id: string,
	defaults: Record<string, unknown>,
	loader: () => Promise<RuntimeRegistryEntry>
): RuntimeRegistryEntry {
	let loadPromise: Promise<RuntimeRegistryEntry> | null = null;

	// Minimal permissive stub schema used until the real schema is loaded.
	// No additionalProperties constraint so valid runtime-specific config properties
	// are not rejected before the full schema arrives.
	const stubSchema: JSONSchemaLike = {
		type: 'object',
	};

	const entry: RuntimeRegistryEntry = {
		id,
		defaults,
		schema: stubSchema,
		factory: (store, events) => {
			let destroyed = false;
			let destroy: (() => void) | null = null;

			if (!loadPromise) {
				loadPromise = loader();
			}

			loadPromise.then(loadedEntry => {
				entry.schema = loadedEntry.schema;
				entry.resolveRuntimeDirectives = loadedEntry.resolveRuntimeDirectives;
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
 * Maps runtime IDs to their configuration entries including defaults, schemas, and factory functions.
 * The default runtime (WebWorkerLogicRuntime) is loaded eagerly; optional runtimes are lazy-loaded
 * on first selection. Each optional runtime starts with a minimal stub schema and replaces it with
 * the full schema after loading.
 */
export const runtimeRegistry: RuntimeRegistry = {
	WebWorkerLogicRuntime: createWebWorkerLogicRuntimeDef(getCodeBuffer, getMemory, WebWorkerLogicRuntime),

	MainThreadLogicRuntime: createLazyRuntimeEntry('MainThreadLogicRuntime', { sampleRate: 50 }, async () => {
		const { createMainThreadLogicRuntimeDef } = await import('@8f4e/runtime-main-thread-logic/runtime-def');
		return createMainThreadLogicRuntimeDef(getCodeBuffer, getMemory);
	}),

	AudioWorkletRuntime: createLazyRuntimeEntry('AudioWorkletRuntime', { sampleRate: 48000 }, async () => {
		const [{ createAudioWorkletRuntimeDef }, { default: audioWorkletUrl }] = await Promise.all([
			import('@8f4e/runtime-audio-worklet/runtime-def'),
			import('@8f4e/runtime-audio-worklet/worklet?url'),
		]);
		return createAudioWorkletRuntimeDef(getCodeBuffer, getMemory, audioWorkletUrl);
	}),

	WebWorkerMIDIRuntime: createLazyRuntimeEntry('WebWorkerMIDIRuntime', { sampleRate: 50 }, async () => {
		const [{ createWebWorkerMIDIRuntimeDef }, { default: WebWorkerMIDIRuntime }] = await Promise.all([
			import('@8f4e/runtime-web-worker-midi/runtime-def'),
			import('@8f4e/runtime-web-worker-midi?worker'),
		]);
		return createWebWorkerMIDIRuntimeDef(getCodeBuffer, getMemory, WebWorkerMIDIRuntime);
	}),
};
