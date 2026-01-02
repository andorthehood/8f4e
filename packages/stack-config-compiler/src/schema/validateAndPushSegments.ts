/**
 * Validates and pushes path segments onto the scope stack
 */

import validateNavigation from './validateNavigation';

import type { SchemaNode, SegmentValidationError } from './types';

/**
 * Validates and pushes path segments onto the scope stack with schema validation.
 * Shared helper for scope/rescope/rescopeTop commands.
 *
 * @param state - The VM state containing schemaRoot and scopeStack
 * @param segments - Path segments to validate and push
 * @returns Array of validation errors (empty if all valid)
 */
export default function validateAndPushSegments(
	state: { schemaRoot?: SchemaNode; scopeStack: string[] },
	segments: string[]
): SegmentValidationError[] {
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
			state.scopeStack.push(segment);
		}
	}

	return errors;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { default: preprocessSchema } = await import('./preprocessSchema');

	describe('validateAndPushSegments', () => {
		it('should push segments to scope stack without schema', () => {
			const state = { scopeStack: [] as string[] };
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
			const state = { schemaRoot, scopeStack: [] as string[] };

			const errors = validateAndPushSegments(state, ['unknown']);
			expect(errors).toHaveLength(1);
			expect(errors[0].kind).toBe('schema');
			expect(errors[0].message).toContain('Unknown key');
			expect(state.scopeStack).toEqual(['unknown']); // Still pushes to stack
		});

		it('should skip empty segments', () => {
			const state = { scopeStack: [] as string[] };
			const errors = validateAndPushSegments(state, ['foo', '', 'bar']);
			expect(errors).toHaveLength(0);
			expect(state.scopeStack).toEqual(['foo', 'bar']);
		});
	});
}
