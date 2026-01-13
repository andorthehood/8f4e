/**
 * RescopeSuffix command - replaces the trailing suffix of the scope stack with new path segments
 */

import { validateAndPushSegments } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export default function executeRescopeSuffix(state: VMState, command: Command): CommandError[] | null {
	const segments = command.pathSegments || [];

	if (state.scopeStack.length < segments.length) {
		return [
			{
				message: `Cannot rescopeSuffix: scope stack has ${state.scopeStack.length} segment(s), but suffix has ${segments.length} segment(s)`,
				kind: 'exec',
			},
		];
	}

	// Pop the last n segments (if any)
	if (segments.length > 0) {
		state.scopeStack.splice(-segments.length, segments.length);
		state.constantsStack.splice(-segments.length, segments.length);
	}

	// Push new segments with schema validation
	const errors = validateAndPushSegments(state, segments);

	// Push empty constants maps for each new segment
	for (let i = 0; i < segments.length; i++) {
		state.constantsStack.push(new Map());
	}

	return errors.length > 0 ? errors : null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('executeRescopeSuffix', () => {
		it('should replace suffix', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['icons', 'piano', 'title'],
				constantsStack: [new Map(), new Map(), new Map(), new Map()],
			};
			const result = executeRescopeSuffix(state, {
				type: 'rescopeSuffix',
				pathSegments: ['harp', 'title'],
				lineNumber: 1,
			});
			expect(result).toBeNull();
			expect(state.scopeStack).toEqual(['icons', 'harp', 'title']);
		});

		it('should maintain constants stack alignment', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['icons', 'piano', 'title'],
				constantsStack: [new Map(), new Map([['BASE', 1]]), new Map([['OLD', 2]]), new Map([['OLD2', 3]])],
			};
			executeRescopeSuffix(state, {
				type: 'rescopeSuffix',
				pathSegments: ['harp', 'title'],
				lineNumber: 1,
			});
			expect(state.constantsStack).toHaveLength(4);
			expect(state.constantsStack[0]).toBeInstanceOf(Map);
			expect(state.constantsStack[1].get('BASE')).toBe(1);
			expect(state.constantsStack[2].size).toBe(0);
			expect(state.constantsStack[3].size).toBe(0);
		});

		it('should error when suffix longer than stack', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: ['foo'],
				constantsStack: [new Map(), new Map()],
			};
			const result = executeRescopeSuffix(state, {
				type: 'rescopeSuffix',
				pathSegments: ['bar', 'baz'],
				lineNumber: 1,
			});
			expect(result).toEqual([
				{
					message: 'Cannot rescopeSuffix: scope stack has 1 segment(s), but suffix has 2 segment(s)',
					kind: 'exec',
				},
			]);
		});
	});
}
