/**
 * Const command - defines a constant in the current scope
 */

import type { Command, VMState } from '../types';

export default function executeConst(state: VMState, command: Command): string | null {
	const name = command.identifier as string;
	const value = command.argument!;

	// Get the current scope's constants map (always has at least root map)
	const currentScopeConstants = state.constantsStack[state.constantsStack.length - 1];

	// Check if constant already exists in current scope
	if (currentScopeConstants.has(name)) {
		return `Cannot redefine constant "${name}" in the same scope`;
	}

	// Define the constant
	currentScopeConstants.set(name, value);
	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executeConst', () => {
		it('should define a constant in the current scope', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			const result = executeConst(state, {
				type: 'const',
				identifier: 'MAX_VALUE',
				argument: 100,
				lineNumber: 1,
			});
			expect(result).toBeNull();
			expect(state.constantsStack[0].get('MAX_VALUE')).toBe(100);
		});

		it('should define a constant with string value', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			const result = executeConst(state, {
				type: 'const',
				identifier: 'NAME',
				argument: 'value',
				lineNumber: 1,
			});
			expect(result).toBeNull();
			expect(state.constantsStack).toHaveLength(1);
			expect(state.constantsStack[0].get('NAME')).toBe('value');
		});

		it('should error on same-scope redefinition', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map([['NAME', 'first']])],
			};
			const result = executeConst(state, {
				type: 'const',
				identifier: 'NAME',
				argument: 'second',
				lineNumber: 1,
			});
			expect(result).toBe('Cannot redefine constant "NAME" in the same scope');
		});

		it('should allow different constants in the same scope', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			executeConst(state, { type: 'const', identifier: 'A', argument: 1, lineNumber: 1 });
			executeConst(state, { type: 'const', identifier: 'B', argument: 2, lineNumber: 2 });
			expect(state.constantsStack[0].get('A')).toBe(1);
			expect(state.constantsStack[0].get('B')).toBe(2);
		});
	});
}
