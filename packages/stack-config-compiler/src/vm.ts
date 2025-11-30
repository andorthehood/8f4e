/**
 * VM (Virtual Machine) for executing stack config commands
 */

import {
	executeAppend,
	executeEndScope,
	executePush,
	executeRescope,
	executeRescopeTop,
	executeScope,
	executeSet,
} from './commands';
import { splitPathSegments } from './utils';

import type { Command, CompileError, VMState } from './types';

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
export function setAtPath(config: Record<string, unknown>, path: string, value: unknown): string | null {
	const segments = splitPathSegments(path);

	if (segments.length === 0) {
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
export function appendAtPath(config: Record<string, unknown>, path: string, value: unknown): string | null {
	const segments = splitPathSegments(path);

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
		case 'push':
			return executePush(state, command);
		case 'set':
			return executeSet(state);
		case 'append':
			return executeAppend(state);
		case 'scope':
			return executeScope(state, command);
		case 'rescopeTop':
			return executeRescopeTop(state, command);
		case 'rescope':
			return executeRescope(state, command);
		case 'endScope':
			return executeEndScope(state);
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
