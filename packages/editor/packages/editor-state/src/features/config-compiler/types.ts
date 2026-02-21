/**
 * Types for config-compiler feature - stack-config compilation and configuration management.
 */

/**
 * Result of compiling a stack-config program.
 */
export interface ConfigCompilationResult {
	/** The resulting JSON-compatible configuration object, or null if there were errors */
	config: unknown | null;
	/** Array of error objects with line numbers and messages */
	errors: { line: number; message: string; blockIndex?: number }[];
}
