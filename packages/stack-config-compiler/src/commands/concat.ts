/**
 * Concat command - concatenates all values from the data stack into a single string
 */

import type { VMState } from '../types';

export function executeConcat(state: VMState): string | null {
	if (state.dataStack.length === 0) {
		return 'Cannot concat: data stack is empty';
	}

	// Take all values from the stack (bottom to top), convert to strings, and concatenate
	const values = state.dataStack.splice(0, state.dataStack.length);
	const concatenated = values.map(v => String(v)).join('');

	// Replace the entire stack with the single concatenated string
	state.dataStack.push(concatenated);

	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executeConcat', () => {
		it('should concatenate two strings', () => {
			const state: VMState = { config: {}, dataStack: ['foo', 'bar'], scopeStack: [] };
			const result = executeConcat(state);
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['foobar']);
		});

		it('should concatenate three or more values', () => {
			const state: VMState = { config: {}, dataStack: ['a', 'b', 'c'], scopeStack: [] };
			const result = executeConcat(state);
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['abc']);
		});

		it('should coerce numbers to strings', () => {
			const state: VMState = { config: {}, dataStack: ['foo', 123], scopeStack: [] };
			const result = executeConcat(state);
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['foo123']);
		});

		it('should coerce booleans to strings', () => {
			const state: VMState = { config: {}, dataStack: ['value:', true], scopeStack: [] };
			const result = executeConcat(state);
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['value:true']);
		});

		it('should coerce null to string', () => {
			const state: VMState = { config: {}, dataStack: ['is', null], scopeStack: [] };
			const result = executeConcat(state);
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['isnull']);
		});

		it('should handle single value on stack', () => {
			const state: VMState = { config: {}, dataStack: ['only'], scopeStack: [] };
			const result = executeConcat(state);
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['only']);
		});

		it('should return error for empty stack', () => {
			const state: VMState = { config: {}, dataStack: [], scopeStack: [] };
			const result = executeConcat(state);
			expect(result).toBe('Cannot concat: data stack is empty');
			expect(state.dataStack).toEqual([]);
		});

		it('should coerce mixed types to strings', () => {
			const state: VMState = { config: {}, dataStack: ['foo', 'bar', 123, true, null], scopeStack: [] };
			const result = executeConcat(state);
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['foobar123truenull']);
		});
	});
}
