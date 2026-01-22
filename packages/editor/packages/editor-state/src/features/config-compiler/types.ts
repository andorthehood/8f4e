/**
 * Types for config-compiler feature - stack-config compilation and configuration management.
 */

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
 * Editor configuration object compiled from editor config blocks.
 */
export interface EditorConfig {
	font: '8x16' | '6x10';
	colorScheme: string;
}

/**
 * Project configuration object compiled from project config blocks.
 */
export interface ProjectConfig {
	memorySizeBytes: number;
	runtimeSettings: Runtimes;
	disableAutoCompilation: boolean;
	binaryAssets: ConfigBinaryAsset[];
}
