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
export type CommandType = 'push' | 'set' | 'append' | 'concat' | 'scope' | 'rescopeTop' | 'rescope' | 'popScope';

/**
 * An internal representation of a parsed command
 */
export interface Command {
	type: CommandType;
	argument?: Literal; // For push: literal value
	pathSegments?: string[]; // For scope commands: pre-parsed path segments
	lineNumber: number;
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
}

/**
 * Options for compiling a stack config program
 */
export interface CompileOptions {
	/** Optional JSON Schema to validate the resulting config against */
	schema?: JSONSchemaLike;
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
	/** Schema node tree for validation (if schema provided) */
	schemaRoot?: SchemaNode;
	/** Set of paths that have been written to (for required field tracking) */
	writtenPaths?: Set<string>;
}
