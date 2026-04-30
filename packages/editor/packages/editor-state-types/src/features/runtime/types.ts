/**
 * Types for runtime feature - runtime configuration, factories, and execution stats.
 */

import type { StateManager } from '@8f4e/state-manager';
import type { ParsedDirectiveRecord } from '../code-blocks/types';
import type { EventDispatcher } from '../../shared/types';
import type { CodeError } from '../../shared/types';

export interface JSONSchemaLike {
	type?: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
	properties?: Record<string, JSONSchemaLike>;
	required?: readonly string[];
	items?: JSONSchemaLike;
	additionalProperties?: boolean | JSONSchemaLike;
	enum?: readonly unknown[];
	oneOf?: readonly JSONSchemaLike[];
	anyOf?: readonly JSONSchemaLike[];
}

/**
 * Type for runtime factory function.
 * Note: Uses generic S to allow proper typing while avoiding circular dependency with State.
 * The actual State type is provided when the factory is called.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RuntimeFactory<S = any> = (store: StateManager<S>, events: EventDispatcher) => () => void;
export type RuntimeEnvConstantsContributor = (
	codeBlocks: Array<{ parsedDirectives: ParsedDirectiveRecord[]; id?: string | number }>
) => string[];

export type RuntimeDirectiveResolver = (
	codeBlocks: Array<{ parsedDirectives: ParsedDirectiveRecord[]; id?: string | number }>
) => {
	sampleRate?: number;
	errors: CodeError[];
};

export type RuntimeValueMap = Record<string, unknown>;
export type RuntimeValuesByRuntimeId = Record<string, RuntimeValueMap>;

/**
 * Runtime registry entry describing a runtime configuration.
 * Each entry defines a runtime's id, default configuration, schema, and factory function.
 */
export interface RuntimeRegistryEntry {
	/** Unique identifier for this runtime (e.g., 'WebWorkerRuntime') */
	id: string;
	/** Default configuration object for this runtime */
	defaults: Record<string, unknown>;
	/** JSON Schema describing the configuration shape for this runtime */
	schema: JSONSchemaLike;
	/** Runtime-owned resolver for `; ~...` directives relevant to this runtime */
	resolveRuntimeDirectives?: RuntimeDirectiveResolver;
	/** Runtime-owned contribution to the auto-generated `constants env` block */
	getEnvConstants?: RuntimeEnvConstantsContributor;
	/** Factory function that creates the runtime instance */
	factory: RuntimeFactory;
}

/**
 * Runtime registry mapping runtime IDs to their registry entries.
 * Used to configure available runtimes and their schemas at editor initialization.
 */
export type RuntimeRegistry = Record<string, RuntimeRegistryEntry>;

/**
 * WebWorker-based runtime configuration.
 */
export interface WebWorkerRuntime {
	sampleRate: number;
}

/**
 * Main thread runtime configuration.
 */
export interface MainThreadRuntime {
	sampleRate: number;
}

/**
 * AudioWorklet runtime configuration.
 *
 * Audio buffers use a unified `memoryId` format in the form `'module:memory'` (e.g., 'audiooutL:buffer').
 * This aligns with the `module:memory` syntax used elsewhere in the editor.
 */
export interface AudioWorkletRuntime {
	sampleRate: number;
}

/**
 * Union of all runtime configuration types.
 */
export type Runtimes = WebWorkerRuntime | MainThreadRuntime | AudioWorkletRuntime;

/**
 * Runtime execution statistics.
 */
export interface RuntimeStats {
	timerPrecisionPercentage: number;
	timeToExecuteLoopMs: number;
	timerDriftMs: number;
	timerExpectedIntervalTimeMs: number;
}
