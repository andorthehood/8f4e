import { describe, expect, it } from 'vitest';

import { classifyIdentifier } from './parseArgument';

/**
 * Ordering regression tests for classifyIdentifier.
 *
 * The if-chain in classifyIdentifier is order-dependent. These tests assert the
 * correct referenceKind for tokens that would be misclassified if the order were violated:
 *
 * 1. intermodular-module-reference (&mod:) before intermodular-reference (&mod:mem)
 *    — &mod: would match isIntermodularReference if checked first (the memory
 *      name part would be empty, but the module-base form must win).
 * 2. intermodular-module-nth-reference (&mod:0) before intermodular-reference (&mod:mem)
 *    — digits are valid [^\s&:.] characters, so &mod:0 silently classifies as a
 *      named memory reference if the nth check comes second.
 * 3. All intermodular forms before the local memory-reference check (&name)
 *    — both start with & so &mod:mem would fall through to memory-reference
 *      if the intermodular check were removed.
 */
describe('classifyIdentifier – check ordering regression', () => {
	describe('&mod: → intermodular-module-reference, not intermodular-reference', () => {
		it('classifies &mod: as intermodular-module-reference', () => {
			expect(classifyIdentifier('&mod:').referenceKind).toBe('intermodular-module-reference');
		});

		it('classifies module:& as intermodular-module-reference', () => {
			expect(classifyIdentifier('module:&').referenceKind).toBe('intermodular-module-reference');
		});
	});

	describe('&mod:0 → intermodular-module-nth-reference, not intermodular-reference', () => {
		it('classifies &mod:0 as intermodular-module-nth-reference', () => {
			expect(classifyIdentifier('&mod:0').referenceKind).toBe('intermodular-module-nth-reference');
		});

		it('classifies &mod:1 as intermodular-module-nth-reference', () => {
			expect(classifyIdentifier('&mod:1').referenceKind).toBe('intermodular-module-nth-reference');
		});

		it('classifies &mod:10 as intermodular-module-nth-reference', () => {
			expect(classifyIdentifier('&mod:10').referenceKind).toBe('intermodular-module-nth-reference');
		});
	});

	describe('&mod:mem → intermodular-reference, not memory-reference', () => {
		it('classifies &mod:mem as intermodular-reference', () => {
			expect(classifyIdentifier('&mod:mem').referenceKind).toBe('intermodular-reference');
		});

		it('classifies mod:mem& as intermodular-reference', () => {
			expect(classifyIdentifier('mod:mem&').referenceKind).toBe('intermodular-reference');
		});
	});

	describe('&name → memory-reference, not any intermodular form', () => {
		it('classifies &name as memory-reference', () => {
			const result = classifyIdentifier('&name');
			expect(result.referenceKind).toBe('memory-reference');
			expect(result.scope).toBe('local');
		});

		it('classifies name& as memory-reference', () => {
			const result = classifyIdentifier('name&');
			expect(result.referenceKind).toBe('memory-reference');
			expect(result.scope).toBe('local');
		});
	});
});
