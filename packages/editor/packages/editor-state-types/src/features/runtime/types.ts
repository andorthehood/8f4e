/**
 * Types for runtime feature - runtime factories and execution stats.
 */

import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher } from '../../shared/types';
import type { EditorConfig, EditorConfigSchemaContribution } from '../editor-config/types';

/**
 * Type for runtime factory function.
 * Note: Uses generic S to allow proper typing while avoiding circular dependency with State.
 * The actual State type is provided when the factory is called.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RuntimeFactory<S = any> = (store: StateManager<S>, events: EventDispatcher) => () => void;
export type RuntimeEnvConstantsContributor = (editorConfig: EditorConfig) => string[];

export type RuntimeValueMap = Record<string, unknown>;
export type RuntimeValuesByRuntimeId = Record<string, RuntimeValueMap>;

/**
 * Runtime registry entry describing a runtime implementation.
 */
export interface RuntimeRegistryEntry {
	/** Unique identifier for this runtime (e.g., 'WebWorkerRuntime') */
	id: string;
	/** Optional editor-config schema contribution advertised by this runtime. */
	editorConfigSchema?: EditorConfigSchemaContribution;
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
