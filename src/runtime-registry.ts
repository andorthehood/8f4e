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
		properties: { runtime: { type: 'string', enum: [id] } },
		required: ['runtime'],
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
				// Replace the stub schema with the real schema in-place so that
				// any subsequent call to getProjectConfigSchema picks it up,
				// even if this runtime instance has already been destroyed.
				entry.schema = loadedEntry.schema;
				// Trigger config revalidation against the newly loaded schema.
				events.dispatch('compileConfig');
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
 * the full schema after loading, then triggers config revalidation.
 */
export const runtimeRegistry: RuntimeRegistry = {
	WebWorkerLogicRuntime: createWebWorkerLogicRuntimeDef(getCodeBuffer, getMemory, WebWorkerLogicRuntime),

	MainThreadLogicRuntime: createLazyRuntimeEntry(
		'MainThreadLogicRuntime',
		{ runtime: 'MainThreadLogicRuntime', sampleRate: 50 },
		async () => {
			const { createMainThreadLogicRuntimeDef } = await import('@8f4e/runtime-main-thread-logic/runtime-def');
			return createMainThreadLogicRuntimeDef(getCodeBuffer, getMemory);
		}
	),

	AudioWorkletRuntime: createLazyRuntimeEntry(
		'AudioWorkletRuntime',
		{ runtime: 'AudioWorkletRuntime', sampleRate: 44100 },
		async () => {
			const [{ createAudioWorkletRuntimeDef }, { default: audioWorkletUrl }] = await Promise.all([
				import('@8f4e/runtime-audio-worklet/runtime-def'),
				import('@8f4e/runtime-audio-worklet/worklet?url'),
			]);
			return createAudioWorkletRuntimeDef(getCodeBuffer, getMemory, audioWorkletUrl);
		}
	),

	WebWorkerMIDIRuntime: createLazyRuntimeEntry(
		'WebWorkerMIDIRuntime',
		{ runtime: 'WebWorkerMIDIRuntime', sampleRate: 50 },
		async () => {
			const [{ createWebWorkerMIDIRuntimeDef }, { default: WebWorkerMIDIRuntime }] = await Promise.all([
				import('@8f4e/runtime-web-worker-midi/runtime-def'),
				import('@8f4e/runtime-web-worker-midi?worker'),
			]);
			return createWebWorkerMIDIRuntimeDef(getCodeBuffer, getMemory, WebWorkerMIDIRuntime);
		}
	),
};
