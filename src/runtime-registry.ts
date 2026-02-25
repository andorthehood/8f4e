import { createWebWorkerLogicRuntimeDef } from '@8f4e/runtime-web-worker-logic/runtime-def';
import WebWorkerLogicRuntime from '@8f4e/runtime-web-worker-logic?worker';

import { getCodeBuffer, getMemory } from './compiler-callback';

import type { RuntimeFactory, RuntimeRegistry, RuntimeRegistryEntry, JSONSchemaLike } from '@8f4e/editor';

/**
 * Default runtime ID for the application.
 * This is used as the fallback when no runtime is specified or when an unknown runtime is requested.
 */
export const DEFAULT_RUNTIME_ID = 'WebWorkerLogicRuntime';

/**
 * Creates a lazy runtime registry entry that defers loading the runtime implementation
 * until the runtime is first selected. Uses a cached Promise singleton for idempotent,
 * race-safe loading.
 */
function createLazyRuntimeEntry(
	id: string,
	defaults: Record<string, unknown>,
	schema: JSONSchemaLike,
	loader: () => Promise<RuntimeFactory>
): RuntimeRegistryEntry {
	let loadPromise: Promise<RuntimeFactory> | null = null;

	return {
		id,
		defaults,
		schema,
		factory: (store, events) => {
			let destroyed = false;
			let destroy: (() => void) | null = null;

			if (!loadPromise) {
				loadPromise = loader();
			}

			loadPromise.then(realFactory => {
				if (!destroyed) {
					destroy = realFactory(store, events);
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
}

/**
 * Runtime registry for the application.
 * Maps runtime IDs to their configuration entries including defaults, schemas, and factory functions.
 * The default runtime (WebWorkerLogicRuntime) is loaded eagerly; optional runtimes are lazy-loaded
 * on first selection.
 */
export const runtimeRegistry: RuntimeRegistry = {
	WebWorkerLogicRuntime: createWebWorkerLogicRuntimeDef(getCodeBuffer, getMemory, WebWorkerLogicRuntime),

	MainThreadLogicRuntime: createLazyRuntimeEntry(
		'MainThreadLogicRuntime',
		{ runtime: 'MainThreadLogicRuntime', sampleRate: 50 },
		{
			type: 'object',
			properties: {
				runtime: { type: 'string', enum: ['MainThreadLogicRuntime'] },
				sampleRate: { type: 'number' },
			},
			required: ['runtime'],
			additionalProperties: false,
		} as JSONSchemaLike,
		async () => {
			const { createMainThreadLogicRuntimeDef } = await import('@8f4e/runtime-main-thread-logic/runtime-def');
			return createMainThreadLogicRuntimeDef(getCodeBuffer, getMemory).factory;
		}
	),

	AudioWorkletRuntime: createLazyRuntimeEntry(
		'AudioWorkletRuntime',
		{ runtime: 'AudioWorkletRuntime', sampleRate: 44100 },
		{
			type: 'object',
			properties: {
				runtime: { type: 'string', enum: ['AudioWorkletRuntime'] },
				sampleRate: { type: 'number' },
				audioInputBuffers: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							memoryId: { type: 'string' },
							channel: { type: 'number' },
							input: { type: 'number' },
						},
						additionalProperties: false,
					},
				},
				audioOutputBuffers: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							memoryId: { type: 'string' },
							channel: { type: 'number' },
							output: { type: 'number' },
						},
						additionalProperties: false,
					},
				},
			},
			required: ['runtime'],
			additionalProperties: false,
		} as JSONSchemaLike,
		async () => {
			const [{ createAudioWorkletRuntimeDef }, { default: audioWorkletUrl }] = await Promise.all([
				import('@8f4e/runtime-audio-worklet/runtime-def'),
				import('@8f4e/runtime-audio-worklet/worklet?url'),
			]);
			return createAudioWorkletRuntimeDef(getCodeBuffer, getMemory, audioWorkletUrl).factory;
		}
	),

	WebWorkerMIDIRuntime: createLazyRuntimeEntry(
		'WebWorkerMIDIRuntime',
		{ runtime: 'WebWorkerMIDIRuntime', sampleRate: 50 },
		{
			type: 'object',
			properties: {
				runtime: { type: 'string', enum: ['WebWorkerMIDIRuntime'] },
				sampleRate: { type: 'number' },
				midiNoteOutputs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							moduleId: { type: 'string' },
							channelMemoryId: { type: 'string' },
							portMemoryId: { type: 'string' },
							velocityMemoryId: { type: 'string' },
							noteOnOffMemoryId: { type: 'string' },
							noteMemoryId: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				midiNoteInputs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							moduleId: { type: 'string' },
							channelMemoryId: { type: 'string' },
							portMemoryId: { type: 'string' },
							velocityMemoryId: { type: 'string' },
							noteOnOffMemoryId: { type: 'string' },
							noteMemoryId: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				midiControlChangeOutputs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							moduleId: { type: 'string' },
							channelMemoryId: { type: 'string' },
							selectedCCMemoryId: { type: 'string' },
							valueMemoryId: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
				midiControlChangeInputs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							moduleId: { type: 'string' },
							channelMemoryId: { type: 'string' },
							selectedCCMemoryId: { type: 'string' },
							valueMemoryId: { type: 'string' },
						},
						additionalProperties: false,
					},
				},
			},
			required: ['runtime'],
			additionalProperties: false,
		} as JSONSchemaLike,
		async () => {
			const [{ createWebWorkerMIDIRuntimeDef }, { default: WebWorkerMIDIRuntime }] = await Promise.all([
				import('@8f4e/runtime-web-worker-midi/runtime-def'),
				import('@8f4e/runtime-web-worker-midi?worker'),
			]);
			return createWebWorkerMIDIRuntimeDef(getCodeBuffer, getMemory, WebWorkerMIDIRuntime).factory;
		}
	),
};
