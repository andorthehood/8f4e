/**
 * Push command - pushes a literal value onto the data stack
 */

import type { Command, Literal, VMState } from '../types';

export default function executePush(state: VMState, command: Command): string | null {
	// If it's an identifier, resolve from constants stack
	if (command.identifier) {
		const name = command.identifier;
		// Search from innermost scope outward
		for (let i = state.constantsStack.length - 1; i >= 0; i--) {
			if (state.constantsStack[i].has(name)) {
				state.dataStack.push(state.constantsStack[i].get(name) as Literal);
				return null;
			}
		}
		return `Unknown constant: ${name}`;
	}

	state.dataStack.push(command.argument as Literal);
	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executePush', () => {
		it('should push literal value onto data stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [],
			};
			const result = executePush(state, { type: 'push', argument: 42, lineNumber: 1 });
			expect(result).toBeNull();
			expect(state.dataStack).toEqual([42]);
		});

		it('should resolve constant from constantsStack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map([['MAX', 100]])],
			};
			const result = executePush(state, { type: 'push', identifier: 'MAX', lineNumber: 1 });
			expect(result).toBeNull();
			expect(state.dataStack).toEqual([100]);
		});

		it('should resolve from nearest scope', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map([['NAME', 'outer']]), new Map([['NAME', 'inner']])],
			};
			const result = executePush(state, { type: 'push', identifier: 'NAME', lineNumber: 1 });
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['inner']);
		});

		it('should error on unknown constant', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			const result = executePush(state, { type: 'push', identifier: 'UNKNOWN', lineNumber: 1 });
			expect(result).toBe('Unknown constant: UNKNOWN');
		});

		it('should resolve constant from outer scope', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map([['OUTER', 'value']]), new Map()],
			};
			const result = executePush(state, { type: 'push', identifier: 'OUTER', lineNumber: 1 });
			expect(result).toBeNull();
			expect(state.dataStack).toEqual(['value']);
		});
	});
}
