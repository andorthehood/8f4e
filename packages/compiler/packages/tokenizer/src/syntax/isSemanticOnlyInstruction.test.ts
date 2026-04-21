import { describe, expect, it } from 'vitest';

import isSemanticOnlyInstruction from './isSemanticOnlyInstruction';

describe('isSemanticOnlyInstruction', () => {
	it('returns true for semantic-only instructions', () => {
		expect(isSemanticOnlyInstruction('module')).toBe(true);
		expect(isSemanticOnlyInstruction('const')).toBe(true);
		expect(isSemanticOnlyInstruction('use')).toBe(true);
		expect(isSemanticOnlyInstruction('init')).toBe(true);
		expect(isSemanticOnlyInstruction('#follow')).toBe(true);
	});

	it('returns false for runtime/codegen instructions', () => {
		expect(isSemanticOnlyInstruction('push')).toBe(false);
		expect(isSemanticOnlyInstruction('int')).toBe(false);
		expect(isSemanticOnlyInstruction('store')).toBe(false);
	});
});
