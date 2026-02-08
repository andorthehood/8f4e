/**
 * Types for the stack config compiler
 */

import type { JSONSchemaLike, SchemaNode } from './schema';

/**
 * A literal value that can be pushed onto the data stack
 */
export type Literal = string | number | boolean | null;

/**
 * Supported commands in the stack config language
 */
export type CommandType =
	| 'push'
	| 'set'
	| 'append'
	| 'concat'
	| 'scope'
	| 'rescopeTop'
	| 'rescope'
	| 'rescopeSuffix'
	| 'popScope'
	| 'clearScope'
	| 'const';

/**
 * An internal representation of a parsed command
 */
export interface Command {
	type: CommandType;
	argument?: Literal; // For push: literal value
	pathSegments?: string[]; // For scope commands: pre-parsed path segments
	identifier?: string; // For const: constant name; For push: constant reference
	lineNumber: number;
	/** The macro ID if this command was expanded from a macro, undefined otherwise */
	macroId?: string;
}

/**
 * Error kind distinguishes schema errors from parse/runtime errors
 */
export type CompileErrorKind = 'parse' | 'exec' | 'schema';

/**
 * Error object returned when compilation fails
 */
export interface CompileError {
	line: number;
	message: string;
	/** Error kind: parse, exec, or schema */
	kind?: CompileErrorKind;
	/** Config path where the error occurred (for schema errors) */
	path?: string;
	/** The macro ID if this error originated from an expanded macro, undefined otherwise */
	macroId?: string;
}

/**
 * Options for compiling a stack config program
 */
export interface CompileOptions {
	/** Optional JSON Schema to validate the resulting config against */
	schema?: JSONSchemaLike;
	/** Optional array of macro source strings for macro expansion */
	macros?: string[];
}

/**
 * Result of compiling a stack config program
 */
export interface CompileResult {
	/** JSON-compatible object when there are no errors, otherwise null */
	config: unknown | null;
	/** Array of error objects with line numbers and messages */
	errors: CompileError[];
}

/**
 * Internal state of the VM during execution
 */
export interface VMState {
	config: Record<string, unknown>;
	dataStack: Literal[];
	scopeStack: string[];
	/** Stack of constant maps: root map at index 0, then one map per scope segment (always length = scopeStack.length + 1) */
	constantsStack: Map<string, Literal>[];
	/** Schema node tree for validation (if schema provided) */
	schemaRoot?: SchemaNode;
	/** Set of paths that have been written to (for required field tracking) */
	writtenPaths?: Set<string>;
}
