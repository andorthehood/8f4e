import { createWebWorkerLogicRuntimeDef } from '@8f4e/runtime-web-worker-logic/runtime-def';
import { createMainThreadLogicRuntimeDef } from '@8f4e/runtime-main-thread-logic/runtime-def';
import { createAudioWorkletRuntimeDef } from '@8f4e/runtime-audio-worklet/runtime-def';
import { createWebWorkerMIDIRuntimeDef } from '@8f4e/runtime-web-worker-midi/runtime-def';
import WebWorkerLogicRuntime from '@8f4e/runtime-web-worker-logic?worker';
import WebWorkerMIDIRuntime from '@8f4e/runtime-web-worker-midi?worker';
import audioWorkletUrl from '@8f4e/runtime-audio-worklet/worklet?url';

import { getCodeBuffer, getMemory } from './compiler-callback';

import type { RuntimeRegistry } from '@8f4e/editor';

/**
 * Default runtime ID for the application.
 * This is used as the fallback when no runtime is specified or when an unknown runtime is requested.
 */
export const DEFAULT_RUNTIME_ID = 'WebWorkerLogicRuntime';

/**
 * Runtime registry for the application.
 * Maps runtime IDs to their configuration entries including defaults, schemas, and factory functions.
 */
export const runtimeRegistry: RuntimeRegistry = {
	WebWorkerLogicRuntime: createWebWorkerLogicRuntimeDef(getCodeBuffer, getMemory, WebWorkerLogicRuntime),
	MainThreadLogicRuntime: createMainThreadLogicRuntimeDef(getCodeBuffer, getMemory),
	AudioWorkletRuntime: createAudioWorkletRuntimeDef(getCodeBuffer, getMemory, audioWorkletUrl),
	WebWorkerMIDIRuntime: createWebWorkerMIDIRuntimeDef(getCodeBuffer, getMemory, WebWorkerMIDIRuntime),
};
