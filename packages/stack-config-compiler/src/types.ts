/**
 * Types for the stack config compiler
 */

/**
 * A literal value that can be pushed onto the data stack
 */
export type Literal = string | number | boolean | null;

/**
 * Supported commands in the stack config language
 */
export type CommandType = 'push' | 'set' | 'append' | 'scope' | 'rescopeTop' | 'rescope' | 'endScope';

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
 * Error object returned when compilation fails
 */
export interface CompileError {
	line: number;
	message: string;
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
}
