/**
 * Types for config-compiler feature - stack-config compilation and configuration management.
 */

import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { Runtimes } from '../runtime/types';

/**
 * Result of compiling a stack-config program.
 */
export interface ConfigCompilationResult {
	/** The resulting JSON-compatible configuration object, or null if there were errors */
	config: unknown | null;
	/** Array of error objects with line numbers and messages */
	errors: { line: number; message: string }[];
}

/**
 * Binary asset reference in configuration.
 */
export interface ConfigBinaryAsset {
	url: string;
	memoryId: string;
}

/**
 * Runtime configuration object compiled from config blocks.
 */
export interface ConfigObject {
	memorySizeBytes: number;
	selectedRuntime: number;
	runtimeSettings: Runtimes[];
	disableAutoCompilation: boolean;
	binaryAssets: ConfigBinaryAsset[];
}
