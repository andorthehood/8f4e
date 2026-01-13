/**
 * Scope command - pushes path segments onto the scope stack
 */

import { validateAndPushSegments } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export default function executeScope(state: VMState, command: Command): CommandError[] | null {
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

	describe('executeScope', () => {
		it('should push segments to scope stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			const result = executeScope(state, {
				type: 'scope',
				pathSegments: ['foo', 'bar'],
				lineNumber: 1,
			});
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual(['foo', 'bar']);
		});

		it('should push empty constants maps', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			executeScope(state, {
				type: 'scope',
				pathSegments: ['foo', 'bar'],
				lineNumber: 1,
			});
			expect(state.constantsStack).toHaveLength(3);
			expect(state.constantsStack[0]).toBeInstanceOf(Map);
			expect(state.constantsStack[1]).toBeInstanceOf(Map);
			expect(state.constantsStack[2]).toBeInstanceOf(Map);
		});
	});
}
