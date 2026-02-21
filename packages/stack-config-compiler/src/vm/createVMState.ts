import type { VMState } from '../types';
import type { SchemaNode } from '../schema';

interface CreateVMStateOptions {
	config?: Record<string, unknown>;
	writtenPaths?: Set<string>;
}

/**
 * Creates a fresh VM state
 */
export default function createVMState(schemaRoot?: SchemaNode, options: CreateVMStateOptions = {}): VMState {
	const state: VMState = {
		config: options.config ?? {},
		dataStack: [],
		scopeStack: [],
		constantsStack: [new Map()], // Start with root-level constants map
	};

	if (schemaRoot) {
		state.schemaRoot = schemaRoot;
		state.writtenPaths = options.writtenPaths ?? new Set();
	}

	return state;
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

		it('should create empty constants stack', () => {
			expect(createVMState().constantsStack).toEqual([new Map()]);
		});

		it('should create independent instances', () => {
			const state1 = createVMState();
			const state2 = createVMState();
			state1.dataStack.push(1);
			expect(state2.dataStack).toEqual([]);
		});

		it('should not have schema properties without schema', () => {
			const state = createVMState();
			expect(state.schemaRoot).toBeUndefined();
			expect(state.writtenPaths).toBeUndefined();
		});
	});
}
