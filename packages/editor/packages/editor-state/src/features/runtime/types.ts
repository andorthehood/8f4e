/**
 * Types for runtime feature - runtime configuration, factories, and execution stats.
 */

import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher } from '../../shared/types';
import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';

/**
 * Type for runtime factory function.
 * Note: Uses 'any' for State to avoid circular dependency.
 * The actual State type is imported from ../../types.ts in consuming code.
 */
export type RuntimeFactory = (store: StateManager<any>, events: EventDispatcher) => () => void;

/**
 * Runtime registry entry describing a runtime configuration.
 * Each entry defines a runtime's id, default configuration, schema, and factory function.
 */
export interface RuntimeRegistryEntry {
	/** Unique identifier for this runtime (e.g., 'WebWorkerLogicRuntime') */
	id: string;
	/** Default configuration object for this runtime */
	defaults: Record<string, unknown>;
	/** JSON Schema describing the configuration shape for this runtime */
	schema: JSONSchemaLike;
	/** Factory function that creates the runtime instance */
	factory: RuntimeFactory;
}

/**
 * Runtime registry mapping runtime IDs to their registry entries.
 * Used to configure available runtimes and their schemas at editor initialization.
 */
export type RuntimeRegistry = Record<string, RuntimeRegistryEntry>;

/**
 * WebWorker-based logic runtime configuration.
 */
export interface WebWorkerLogicRuntime {
	runtime: 'WebWorkerLogicRuntime';
	sampleRate: number;
}

/**
 * Main thread logic runtime configuration.
 */
export interface MainThreadLogicRuntime {
	runtime: 'MainThreadLogicRuntime';
	sampleRate: number;
}

/**
 * AudioWorklet runtime configuration.
 *
 * Audio buffers use a unified `memoryId` format in the form `'module.memory'` (e.g., 'audiooutL.buffer').
 * This aligns with the `module.memory` syntax used elsewhere in the editor.
 */
export interface AudioWorkletRuntime {
	runtime: 'AudioWorkletRuntime';
	sampleRate: number;
	audioInputBuffers?: {
		/**
		 * Memory identifier in unified format `'module.memory'` (e.g., 'audioin.buffer').
		 */
		memoryId: string;
		channel: number;
		input: number;
	}[];
	audioOutputBuffers?: {
		/**
		 * Memory identifier in unified format `'module.memory'` (e.g., 'audiooutL.buffer').
		 */
		memoryId: string;
		channel: number;
		output: number;
	}[];
}

interface MidiNoteIO {
	moduleId: string;
	channelMemoryId?: string;
	portMemoryId?: string;
	velocityMemoryId?: string;
	noteOnOffMemoryId?: string;
	noteMemoryId?: string;
}

interface MidiCCIO {
	moduleId: string;
	channelMemoryId?: string;
	selectedCCMemoryId?: string;
	valueMemoryId?: string;
}

/**
 * WebWorker-based MIDI runtime configuration.
 */
export interface WebWorkerMIDIRuntime {
	runtime: 'WebWorkerMIDIRuntime';
	sampleRate: number;
	midiNoteOutputs?: MidiNoteIO[];
	midiNoteInputs?: MidiNoteIO[];
	midiControlChangeOutputs?: MidiCCIO[];
	midiControlChangeInputs?: MidiCCIO[];
}

/**
 * Union of all runtime configuration types.
 */
export type Runtimes = WebWorkerLogicRuntime | MainThreadLogicRuntime | AudioWorkletRuntime | WebWorkerMIDIRuntime;

/**
 * MIDI input/output state.
 */
export interface Midi {
	outputs: MIDIOutput[];
	inputs: MIDIInput[];
}

/**
 * Runtime execution statistics.
 */
export interface RuntimeStats {
	timerPrecisionPercentage: number;
	timeToExecuteLoopMs: number;
	timerDriftMs: number;
	timerExpectedIntervalTimeMs: number;
}
