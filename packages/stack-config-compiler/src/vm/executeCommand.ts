import {
	executeAppend,
	executePopScope,
	executePush,
	executeRescope,
	executeRescopeTop,
	executeScope,
	executeSet,
} from '../commands';

import type { Command, VMState } from '../types';

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
		case 'popScope':
			return executePopScope(state);
		default:
			return `Unknown command: ${(command as Command).type}`;
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executeCommand', () => {
		it('should execute push command', () => {
			const state = { config: {}, dataStack: [], scopeStack: [] };
			executeCommand(state, { type: 'push', argument: 42, lineNumber: 1 });
			expect(state.dataStack).toEqual([42]);
		});

		it('should execute scope command', () => {
			const state = { config: {}, dataStack: [], scopeStack: [] };
			executeCommand(state, { type: 'scope', pathSegments: ['foo', 'bar'], lineNumber: 1 });
			expect(state.scopeStack).toEqual(['foo', 'bar']);
		});

		it('should execute set command', () => {
			const state = { config: {}, dataStack: [42], scopeStack: ['name'] };
			executeCommand(state, { type: 'set', lineNumber: 1 });
			expect(state.config).toEqual({ name: 42 });
		});

		it('should execute popScope command', () => {
			const state = { config: {}, dataStack: [], scopeStack: ['foo', 'bar'] };
			executeCommand(state, { type: 'popScope', lineNumber: 1 });
			expect(state.scopeStack).toEqual(['foo']);
		});

		it('should return error for unknown command type', () => {
			const state = { config: {}, dataStack: [], scopeStack: [] };
			const result = executeCommand(state, { type: 'unknown' as 'push', lineNumber: 1 });
			expect(result).toBe('Unknown command: unknown');
		});
	});
}
