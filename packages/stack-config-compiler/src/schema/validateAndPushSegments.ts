/**
 * Validates and pushes path segments onto the scope stack
 */

import validateNavigation from './validateNavigation';

import { isArrayAppendSlot } from '../vm/isArrayIndex';
import { splitPathSegments } from '../utils';

import type { SegmentValidationError } from './types';
import type { VMState } from '../types';

/**
 * Validates and pushes path segments onto the scope stack with schema validation.
 * Shared helper for scope/rescope/rescopeTop commands.
 *
 * @param state - The VM state containing schemaRoot, scopeStack, and config
 * @param segments - Path segments to validate and push
 * @returns Array of validation errors (empty if all valid)
 */
export default function validateAndPushSegments(state: VMState, segments: string[]): SegmentValidationError[] {
	const errors: SegmentValidationError[] = [];

	for (const segment of segments) {
		if (segment) {
			if (state.schemaRoot) {
				const navError = validateNavigation(state.schemaRoot, state.scopeStack, segment);
				if (navError) {
					errors.push({
						message: navError.message,
						kind: 'schema',
						path: navError.path,
					});
				}
			}

			// If segment is [], resolve it to the actual array index
			if (isArrayAppendSlot(segment)) {
				// Build the path up to this point to find the array
				const pathSegments = splitPathSegments(state.scopeStack.join('.'));
				let current: unknown = state.config;

				// Navigate without creating intermediate objects
				for (const seg of pathSegments) {
					if (seg.startsWith('[') && seg.endsWith(']')) {
						const index = parseInt(seg.slice(1, -1), 10);
						if (Number.isNaN(index)) {
							// Invalid array index
							current = undefined;
							break;
						}
						if (Array.isArray(current)) {
							current = current[index];
						} else {
							current = undefined;
							break;
						}
					} else {
						if (typeof current === 'object' && current !== null) {
							current = (current as Record<string, unknown>)[seg];
						} else {
							current = undefined;
							break;
						}
					}
				}

				// Now current should be the array (or undefined)
				if (Array.isArray(current)) {
					// Push the actual numeric index instead of []
					state.scopeStack.push(`[${current.length}]`);
				} else {
					// Array doesn't exist yet, so it will be empty - push [0]
					state.scopeStack.push('[0]');
				}
			} else {
				state.scopeStack.push(segment);
			}
		}
	}

	return errors;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { default: preprocessSchema } = await import('./preprocessSchema');

	describe('validateAndPushSegments', () => {
		it('should push segments to scope stack without schema', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			const errors = validateAndPushSegments(state, ['foo', 'bar']);
			expect(errors).toHaveLength(0);
			expect(state.scopeStack).toEqual(['foo', 'bar']);
		});

		it('should validate and push segments with schema', () => {
			const schema = {
				type: 'object' as const,
				properties: {
					name: { type: 'string' as const },
				},
				additionalProperties: false,
			};
			const schemaRoot = preprocessSchema(schema);
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
				schemaRoot,
			};

			const errors = validateAndPushSegments(state, ['unknown']);
			expect(errors).toHaveLength(1);
			expect(errors[0].kind).toBe('schema');
			expect(errors[0].message).toContain('Unknown key');
			expect(state.scopeStack).toEqual(['unknown']); // Still pushes to stack
		});

		it('should skip empty segments', () => {
			const state: VMState = {
				config: {},
				dataStack: [],
				scopeStack: [],
				constantsStack: [new Map()],
			};
			const errors = validateAndPushSegments(state, ['foo', '', 'bar']);
			expect(errors).toHaveLength(0);
			expect(state.scopeStack).toEqual(['foo', 'bar']);
		});

		it('should resolve [] to numeric index', () => {
			const state: VMState = {
				config: { items: [1, 2] },
				dataStack: [],
				scopeStack: ['items'],
				constantsStack: [new Map()],
			};
			const errors = validateAndPushSegments(state, ['[]']);
			expect(errors).toHaveLength(0);
			expect(state.scopeStack).toEqual(['items', '[2]']); // Should resolve to next index
		});
	});
}
