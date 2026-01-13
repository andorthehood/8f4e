/**
 * Rescope command - replaces the entire scope stack with new path segments
 */

import { validateAndPushSegments } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export default function executeRescope(state: VMState, command: Command): CommandError[] | null {
	state.scopeStack.length = 0;
	// Keep root constants (index 0), clear all scope-specific constants
	state.constantsStack.length = 1;

	// Push new segments with schema validation
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

	describe('executeRescope', () => {
		it('should replace scope stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['old', 'path'],
				constantsStack: [new Map(), new Map(), new Map()],
			};
			const result = executeRescope(state, {
				type: 'rescope',
				pathSegments: ['new', 'path'],
				lineNumber: 1,
			});
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual(['new', 'path']);
		});

		it('should replace constants stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['old'],
				constantsStack: [new Map([['ROOT', 0]]), new Map([['A', 1]])],
			};
			executeRescope(state, {
				type: 'rescope',
				pathSegments: ['new', 'path'],
				lineNumber: 1,
			});
			expect(state.constantsStack).toHaveLength(3);
			expect(state.constantsStack[0].get('ROOT')).toBe(0); // Root preserved
			expect(state.constantsStack[1].size).toBe(0);
			expect(state.constantsStack[2].size).toBe(0);
		});
	});
}
