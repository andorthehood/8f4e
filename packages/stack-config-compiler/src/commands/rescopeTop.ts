/**
 * RescopeTop command - replaces the top scope segment with new path segments
 */

import { validateAndPushSegments } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export default function executeRescopeTop(state: VMState, command: Command): CommandError[] | null {
	if (state.scopeStack.length === 0) {
		return [{ message: 'Cannot rescopeTop: scope stack is empty', kind: 'exec' }];
	}

	state.scopeStack.pop();
	state.constantsStack.pop();

	const segments = command.pathSegments || [];
	const errors = validateAndPushSegments(state, segments);

	// Push empty constants maps for each new segment
	for (let i = 0; i < segments.length; i++) {
		state.constantsStack.push(new Map());
	}

	return errors.length > 0 ? errors : null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executeRescopeTop', () => {
		it('should replace top scope segment', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['base', 'old'],
				constantsStack: [new Map(), new Map(), new Map()],
			};
			const result = executeRescopeTop(state, {
				type: 'rescopeTop',
				pathSegments: ['new'],
				lineNumber: 1,
			});
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual(['base', 'new']);
		});

		it('should maintain constants stack alignment', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['base', 'old'],
				constantsStack: [new Map(), new Map([['BASE', 1]]), new Map([['OLD', 2]])],
			};
			executeRescopeTop(state, {
				type: 'rescopeTop',
				pathSegments: ['new', 'path'],
				lineNumber: 1,
			});
			expect(state.constantsStack).toHaveLength(4);
			expect(state.constantsStack[0]).toBeInstanceOf(Map);
			expect(state.constantsStack[1].get('BASE')).toBe(1);
			expect(state.constantsStack[2].size).toBe(0);
			expect(state.constantsStack[3].size).toBe(0);
		});

		it('should error when scope stack is empty', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			const result = executeRescopeTop(state, {
				type: 'rescopeTop',
				pathSegments: ['new'],
				lineNumber: 1,
			});
			expect(result).toEqual([{ message: 'Cannot rescopeTop: scope stack is empty', kind: 'exec' }]);
		});
	});
}
