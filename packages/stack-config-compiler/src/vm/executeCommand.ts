import executeAppend from '../commands/append';
import executeClearScope from '../commands/clearScope';
import executeConcat from '../commands/concat';
import executeConst from '../commands/const';
import executePopScope from '../commands/popScope';
import executePush from '../commands/push';
import executeRescope from '../commands/rescope';
import executeRescopeSuffix from '../commands/rescopeSuffix';
import executeRescopeTop from '../commands/rescopeTop';
import executeScope from '../commands/scope';
import executeSet from '../commands/set';

import type { Command, VMState, CompileErrorKind } from '../types';

/**
 * Partial error object returned from command execution (line will be added by caller)
 */
export interface CommandError {
	message: string;
	kind?: CompileErrorKind;
	path?: string;
}

/**
 * Executes a single command against the VM state
 * Returns an array of error objects if the command fails, null otherwise
 */
export function executeCommand(state: VMState, command: Command): CommandError[] | null {
	switch (command.type) {
		case 'push':
			return wrapError(executePush(state, command));
		case 'set': {
			// set <arg> is sugar for: push <arg> ; set
			if (command.argument !== undefined || command.identifier !== undefined) {
				const pushError = executePush(state, {
					...command,
					type: 'push',
				});
				if (pushError !== null) {
					return wrapError(pushError);
				}
			}
			return executeSet(state);
		}
		case 'append':
			return executeAppend(state);
		case 'concat':
			return wrapError(executeConcat(state));
		case 'scope':
			return executeScope(state, command);
		case 'rescopeTop':
			return executeRescopeTop(state, command);
		case 'rescope':
			return executeRescope(state, command);
		case 'rescopeSuffix':
			return executeRescopeSuffix(state, command);
		case 'popScope':
			return wrapError(executePopScope(state));
		case 'clearScope':
			return executeClearScope(state);
		case 'const':
			return wrapError(executeConst(state, command));
		default:
			return [{ message: `Unknown command: ${(command as Command).type}`, kind: 'exec' }];
	}
}

/**
 * Wraps a simple error string into an array of CommandError
 */
function wrapError(error: string | null): CommandError[] | null {
	if (error === null) return null;
	return [{ message: error, kind: 'exec' }];
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executeCommand', () => {
		it('should execute push command', () => {
			const state: VMState = { config: {}, dataStack: [], scopeStack: [], constantsStack: [new Map()] };
			executeCommand(state, { type: 'push', argument: 42, lineNumber: 1 });
			expect(state.dataStack).toEqual([42]);
		});

		it('should execute scope command', () => {
			const state: VMState = { config: {}, dataStack: [], scopeStack: [], constantsStack: [new Map()] };
			executeCommand(state, { type: 'scope', pathSegments: ['foo', 'bar'], lineNumber: 1 });
			expect(state.scopeStack).toEqual(['foo', 'bar']);
		});

		it('should execute set command', () => {
			const state: VMState = { config: {}, dataStack: [42], scopeStack: ['name'], constantsStack: [new Map()] };
			executeCommand(state, { type: 'set', lineNumber: 1 });
			expect(state.config).toEqual({ name: 42 });
		});

		it('should execute set command with inline literal', () => {
			const state: VMState = { config: {}, dataStack: [], scopeStack: ['name'], constantsStack: [new Map()] };
			executeCommand(state, { type: 'set', argument: 42, lineNumber: 1 });
			expect(state.config).toEqual({ name: 42 });
		});

		it('should execute set command with inline constant reference', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['name'],
				constantsStack: [new Map([['VALUE', 'ok']])],
			};
			executeCommand(state, { type: 'set', identifier: 'VALUE', lineNumber: 1 });
			expect(state.config).toEqual({ name: 'ok' });
		});

		it('should execute concat command', () => {
			const state: VMState = { config: {}, dataStack: ['foo', 'bar'], scopeStack: [], constantsStack: [new Map()] };
			const result = executeCommand(state, { type: 'concat', lineNumber: 1 });
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['foobar']);
		});

		it('should execute popScope command', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['foo', 'bar'],
				constantsStack: [new Map(), new Map(), new Map()],
			};
			executeCommand(state, { type: 'popScope', lineNumber: 1 });
			expect(state.scopeStack).toEqual(['foo']);
		});

		it('should execute rescopeSuffix command', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['icons', 'piano', 'title'],
				constantsStack: [new Map(), new Map(), new Map(), new Map()],
			};
			const result = executeCommand(state, {
				type: 'rescopeSuffix',
				pathSegments: ['harp', 'title'],
				lineNumber: 1,
			});
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual(['icons', 'harp', 'title']);
		});

		it('should return error for rescopeSuffix with insufficient scope', () => {
			const state: VMState = { config: {}, dataStack: [], scopeStack: ['foo'], constantsStack: [new Map(), new Map()] };
			const result = executeCommand(state, {
				type: 'rescopeSuffix',
				pathSegments: ['bar', 'baz'],
				lineNumber: 1,
			});
			expect(result).toEqual([
				{
					message: 'Cannot rescopeSuffix: scope stack has 1 segment(s), but suffix has 2 segment(s)',
					kind: 'exec',
				},
			]);
		});

		it('should allow rescopeSuffix when suffix equals entire scope stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['foo', 'bar'],
				constantsStack: [new Map(), new Map(), new Map()],
			};
			const result = executeCommand(state, {
				type: 'rescopeSuffix',
				pathSegments: ['baz', 'qux'],
				lineNumber: 1,
			});
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual(['baz', 'qux']);
		});

		it('should execute clearScope command', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['foo', 'bar', 'baz'],
				constantsStack: [new Map(), new Map(), new Map(), new Map()],
			};
			const result = executeCommand(state, { type: 'clearScope', lineNumber: 1 });
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual([]);
			expect(state.constantsStack).toHaveLength(1);
		});

		it('should handle rescopeSuffix with empty path segments', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['foo', 'bar'],
				constantsStack: [new Map(), new Map(), new Map()],
			};
			const result = executeCommand(state, {
				type: 'rescopeSuffix',
				pathSegments: [],
				lineNumber: 1,
			});
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual(['foo', 'bar']);
		});

		it('should return error for unknown command type', () => {
			const state: VMState = { config: {}, dataStack: [], scopeStack: [], constantsStack: [new Map()] };
			const result = executeCommand(state, { type: 'unknown' as 'push', lineNumber: 1 });
			expect(result).toEqual([{ message: 'Unknown command: unknown', kind: 'exec' }]);
		});
	});
}
