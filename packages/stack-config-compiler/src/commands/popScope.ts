/**
 * PopScope command - pops one segment from the scope stack
 */

import type { VMState } from '../types';

export default function executePopScope(state: VMState): string | null {
	if (state.scopeStack.length === 0) {
		return 'Cannot popScope: scope stack is empty';
	}
	state.scopeStack.pop();
	state.constantsStack.pop();
	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executePopScope', () => {
		it('should pop from scope stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['foo', 'bar'],
				constantsStack: [new Map(), new Map(), new Map()],
			};
			const result = executePopScope(state);
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual(['foo']);
		});

		it('should pop from constants stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['foo'],
				constantsStack: [new Map(), new Map([['A', 1]])],
			};
			const result = executePopScope(state);
			expect(result).toBeNull();
			expect(state.constantsStack).toEqual([new Map()]);
		});

		it('should error when scope stack is empty', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			const result = executePopScope(state);
			expect(result).toBe('Cannot popScope: scope stack is empty');
		});
	});
}
