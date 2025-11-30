import type { VMState } from '../types';

/**
 * Creates a fresh VM state
 */
export function createVMState(): VMState {
	return {
		config: {},
		dataStack: [],
		scopeStack: [],
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('createVMState', () => {
		it('should create empty config', () => {
			expect(createVMState().config).toEqual({});
		});

		it('should create empty data stack', () => {
			expect(createVMState().dataStack).toEqual([]);
		});

		it('should create empty scope stack', () => {
			expect(createVMState().scopeStack).toEqual([]);
		});

		it('should create independent instances', () => {
			const state1 = createVMState();
			const state2 = createVMState();
			state1.dataStack.push(1);
			expect(state2.dataStack).toEqual([]);
		});
	});
}
