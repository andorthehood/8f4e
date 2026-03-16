/**
 * Types for the runtime-directives feature.
 * Runtime directives use `; ~<name> <args...>` syntax and are project-global.
 */

/**
 * The resolved runtime directives state surface.
 * Contains values extracted from `; ~<name>` directives across all code blocks.
 */
export interface ResolvedRuntimeDirectives {
	/** Sample rate from `; ~sampleRate <value>` directives */
	sampleRate?: number;
}
