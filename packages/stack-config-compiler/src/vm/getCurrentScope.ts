import type { VMState } from '../types';

/**
 * Gets the current scope path as a string
 */
export default function getCurrentScope(state: VMState): string {
	return state.scopeStack.join('.');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getCurrentScope', () => {
		it('should return empty string for empty scope stack', () => {
			expect(getCurrentScope({ config: {}, dataStack: [], scopeStack: [] })).toBe('');
		});

		it('should return single segment', () => {
			expect(getCurrentScope({ config: {}, dataStack: [], scopeStack: ['foo'] })).toBe('foo');
		});

		it('should join multiple segments with dots', () => {
			expect(getCurrentScope({ config: {}, dataStack: [], scopeStack: ['foo', 'bar', 'baz'] })).toBe('foo.bar.baz');
		});

		it('should handle array indices', () => {
			expect(getCurrentScope({ config: {}, dataStack: [], scopeStack: ['items', '[0]'] })).toBe('items.[0]');
		});
	});
}
