import { createWebWorkerLogicRuntimeDef } from './runtime-defs/web-worker-logic';
import { createMainThreadLogicRuntimeDef } from './runtime-defs/main-thread-logic';
import { createAudioWorkletRuntimeDef } from './runtime-defs/audio-worklet';
import { createWebWorkerMIDIRuntimeDef } from './runtime-defs/web-worker-midi';
import { getCodeBuffer, getMemory } from './compiler-callback';

import type { RuntimeRegistry } from '@8f4e/editor';

/**
 * Default runtime ID for the application.
 * This is used as the fallback when no runtime is specified or when an unknown runtime is requested.
 */
export const DEFAULT_RUNTIME_ID = 'WebWorkerLogicRuntime';

/**
 * Host callbacks for runtime factories.
 * These provide access to the compiled code buffer and WebAssembly memory.
 */
const hostCallbacks = {
	getCodeBuffer,
	getMemory,
};

/**
 * Runtime registry for the application.
 * Maps runtime IDs to their configuration entries including defaults, schemas, and factory functions.
 * Assembled from runtime definitions exported by each runtime package.
 */
export const runtimeRegistry: RuntimeRegistry = {
	WebWorkerLogicRuntime: createWebWorkerLogicRuntimeDef(hostCallbacks),
	MainThreadLogicRuntime: createMainThreadLogicRuntimeDef(hostCallbacks),
	AudioWorkletRuntime: createAudioWorkletRuntimeDef(hostCallbacks),
	WebWorkerMIDIRuntime: createWebWorkerMIDIRuntimeDef(hostCallbacks),
};
