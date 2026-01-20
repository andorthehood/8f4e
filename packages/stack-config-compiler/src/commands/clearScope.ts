/**
 * ClearScope command - clears the entire scope stack (resets to root)
 * Equivalent to rescope "" but with explicit intent
 */

import type { VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export default function executeClearScope(state: VMState): CommandError[] | null {
	// Clear scope stack (reset to root)
	state.scopeStack.length = 0;
	// Keep only root constants (index 0), clear all scope-specific constants
	state.constantsStack.length = 1;

	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executeClearScope', () => {
		it('should clear scope stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['foo', 'bar', 'baz'],
				constantsStack: [new Map(), new Map(), new Map(), new Map()],
			};
			const result = executeClearScope(state);
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual([]);
		});

		it('should reset constants stack to root only', () => {
			const rootConstants = new Map([['ROOT', 0]]);
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['foo', 'bar'],
				constantsStack: [rootConstants, new Map([['A', 1]]), new Map([['B', 2]])],
			};
			executeClearScope(state);
			expect(state.constantsStack).toHaveLength(1);
			expect(state.constantsStack[0]).toBe(rootConstants); // Root preserved
			expect(state.constantsStack[0].get('ROOT')).toBe(0);
		});

		it('should handle already empty scope stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map([['ROOT', 123]])],
			};
			executeClearScope(state);
			expect(state.scopeStack).toEqual([]);
			expect(state.constantsStack).toHaveLength(1);
			expect(state.constantsStack[0].get('ROOT')).toBe(123);
		});
	});
}
