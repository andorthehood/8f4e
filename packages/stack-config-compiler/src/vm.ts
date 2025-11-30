/**
 * VM (Virtual Machine) for executing stack config commands
 */

import type { Command, CompileError, Literal, VMState } from './types';

/**
 * Creates a fresh VM state
 */
export function createVMState(): VMState {
	return {
		config: {},
		dataStack: [],
		scopeStack: [],
	};
}

/**
 * Gets the current scope path as a string
 */
export function getCurrentScope(state: VMState): string {
	return state.scopeStack.join('.');
}

/**
 * Result of splitting a path - either segments or an error
 */
export type SplitPathResult = { segments: string[]; error: null } | { segments: null; error: string };

/**
 * Splits a path string into segments, handling both dot notation and array indices
 * Examples: "foo.bar" -> ["foo", "bar"]
 *           "foo[0].bar" -> ["foo", "[0]", "bar"]
 *           "foo.bar[2].x" -> ["foo", "bar", "[2]", "x"]
 * Returns an error if the path is malformed (e.g., unclosed brackets)
 */
export function splitPath(path: string): SplitPathResult {
	if (!path) return { segments: [], error: null };

	const segments: string[] = [];
	let current = '';

	for (let i = 0; i < path.length; i++) {
		const char = path[i];

		if (char === '.') {
			if (current) {
				segments.push(current);
				current = '';
			}
		} else if (char === '[') {
			if (current) {
				segments.push(current);
				current = '';
			}
			// Find matching ]
			const endBracket = path.indexOf(']', i);
			if (endBracket === -1) {
				return { segments: null, error: `Malformed path: unclosed bracket in "${path}"` };
			}
			segments.push(path.slice(i, endBracket + 1));
			i = endBracket;
		} else {
			current += char;
		}
	}

	if (current) {
		segments.push(current);
	}

	return { segments, error: null };
}

/**
 * Checks if a path segment is an array index (e.g., "[0]", "[3]")
 */
function isArrayIndex(segment: string): boolean {
	return /^\[\d+\]$/.test(segment);
}

/**
 * Extracts the numeric index from an array index segment (e.g., "[0]" -> 0)
 */
function getArrayIndex(segment: string): number {
	return parseInt(segment.slice(1, -1), 10);
}

/**
 * Navigates to a location in the config object, creating intermediate objects/arrays as needed
 * Returns the parent object and the final key for the target location
 */
function navigateToPath(
	config: Record<string, unknown>,
	segments: string[]
): { parent: Record<string, unknown> | unknown[]; key: string | number } | null {
	if (segments.length === 0) {
		// Setting at root level isn't directly supported through this mechanism
		return null;
	}

	let current: Record<string, unknown> | unknown[] = config;

	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i];
		const nextSegment = segments[i + 1];
		const isNextArray = isArrayIndex(nextSegment);

		if (isArrayIndex(segment)) {
			const index = getArrayIndex(segment);
			const arr = current as unknown[];

			if (arr[index] === undefined) {
				arr[index] = isNextArray ? [] : {};
			}

			const next = arr[index];
			if (typeof next !== 'object' || next === null) {
				// Type conflict: can't navigate through a scalar
				return null;
			}
			current = next as Record<string, unknown> | unknown[];
		} else {
			const obj = current as Record<string, unknown>;

			if (obj[segment] === undefined) {
				obj[segment] = isNextArray ? [] : {};
			}

			const next = obj[segment];
			if (typeof next !== 'object' || next === null) {
				// Type conflict: can't navigate through a scalar
				return null;
			}
			current = next as Record<string, unknown> | unknown[];
		}
	}

	const lastSegment = segments[segments.length - 1];
	if (isArrayIndex(lastSegment)) {
		return { parent: current, key: getArrayIndex(lastSegment) };
	}
	return { parent: current, key: lastSegment };
}

/**
 * Sets a value at a path in the config
 */
function setAtPath(config: Record<string, unknown>, path: string, value: unknown): string | null {
	const pathResult = splitPath(path);

	if (pathResult.error !== null) {
		return pathResult.error;
	}

	const segments = pathResult.segments;

	if (segments.length === 0) {
		// Cannot set at root level
		return 'Cannot set at root scope';
	}

	const result = navigateToPath(config, segments);
	if (!result) {
		return 'Type conflict: cannot navigate through scalar value';
	}

	const { parent, key } = result;
	if (Array.isArray(parent)) {
		parent[key as number] = value;
	} else {
		(parent as Record<string, unknown>)[key as string] = value;
	}
	return null;
}

/**
 * Appends a value to an array at a path in the config
 */
function appendAtPath(config: Record<string, unknown>, path: string, value: unknown): string | null {
	const pathResult = splitPath(path);

	if (pathResult.error !== null) {
		return pathResult.error;
	}

	const segments = pathResult.segments;

	if (segments.length === 0) {
		return 'Cannot append at root scope';
	}

	const result = navigateToPath(config, segments);
	if (!result) {
		return 'Type conflict: cannot navigate through scalar value';
	}

	const { parent, key } = result;
	let target: unknown;

	if (Array.isArray(parent)) {
		target = parent[key as number];
		if (target === undefined) {
			parent[key as number] = [];
			target = parent[key as number];
		}
	} else {
		target = (parent as Record<string, unknown>)[key as string];
		if (target === undefined) {
			(parent as Record<string, unknown>)[key as string] = [];
			target = (parent as Record<string, unknown>)[key as string];
		}
	}

	if (!Array.isArray(target)) {
		return `Cannot append to non-array value at path "${path}"`;
	}

	target.push(value);
	return null;
}

/**
 * Executes a single command against the VM state
 * Returns an error message if the command fails, null otherwise
 */
export function executeCommand(state: VMState, command: Command): string | null {
	switch (command.type) {
		case 'push': {
			state.dataStack.push(command.argument as Literal);
			return null;
		}

		case 'set': {
			const currentScope = getCurrentScope(state);

			if (!currentScope) {
				return 'Cannot set at root scope (scope stack is empty)';
			}

			if (state.dataStack.length === 0) {
				return 'Cannot set: data stack is empty';
			}

			// Pop all values from the stack
			const values = state.dataStack.splice(0, state.dataStack.length);

			// If exactly one value, use it directly; otherwise create an array
			const value = values.length === 1 ? values[0] : values;

			const error = setAtPath(state.config, currentScope, value);
			if (error) {
				return error;
			}
			return null;
		}

		case 'append': {
			const currentScope = getCurrentScope(state);

			if (!currentScope) {
				return 'Cannot append at root scope (scope stack is empty)';
			}

			if (state.dataStack.length === 0) {
				return 'Cannot append: data stack is empty';
			}

			// Pop all values from the stack and append each one
			const values = state.dataStack.splice(0, state.dataStack.length);

			for (const val of values) {
				const error = appendAtPath(state.config, currentScope, val);
				if (error) {
					return error;
				}
			}
			return null;
		}

		case 'scope': {
			const path = command.argument as string;
			const pathResult = splitPath(path);
			if (pathResult.error !== null) {
				return pathResult.error;
			}
			for (const segment of pathResult.segments) {
				if (segment) {
					state.scopeStack.push(segment);
				}
			}
			return null;
		}

		case 'rescopeTop': {
			if (state.scopeStack.length === 0) {
				return 'Cannot rescopeTop: scope stack is empty';
			}

			// Pop the top segment
			state.scopeStack.pop();

			// Push new segments
			const path = command.argument as string;
			const pathResult = splitPath(path);
			if (pathResult.error !== null) {
				return pathResult.error;
			}
			for (const segment of pathResult.segments) {
				if (segment) {
					state.scopeStack.push(segment);
				}
			}
			return null;
		}

		case 'rescope': {
			// Clear the scope stack
			state.scopeStack.length = 0;

			// Push new segments
			const path = command.argument as string;
			const pathResult = splitPath(path);
			if (pathResult.error !== null) {
				return pathResult.error;
			}
			for (const segment of pathResult.segments) {
				if (segment) {
					state.scopeStack.push(segment);
				}
			}
			return null;
		}

		case 'endScope': {
			if (state.scopeStack.length === 0) {
				return 'Cannot endScope: scope stack is empty';
			}
			state.scopeStack.pop();
			return null;
		}

		default:
			return `Unknown command: ${(command as Command).type}`;
	}
}

/**
 * Executes a list of commands and returns the final config or errors
 */
export function executeCommands(commands: Command[]): { config: Record<string, unknown>; errors: CompileError[] } {
	const state = createVMState();
	const errors: CompileError[] = [];

	for (const command of commands) {
		const error = executeCommand(state, command);
		if (error) {
			errors.push({
				line: command.lineNumber,
				message: error,
			});
		}
	}

	return {
		config: state.config,
		errors,
	};
}
