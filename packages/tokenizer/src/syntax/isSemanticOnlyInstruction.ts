const semanticOnlyInstructions = new Set(['module', 'moduleEnd', 'constants', 'constantsEnd', 'const', 'use', 'init']);

export default function isSemanticOnlyInstruction(instruction: string): boolean {
	return semanticOnlyInstructions.has(instruction);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isSemanticOnlyInstruction', () => {
		it('returns true for semantic-only instructions', () => {
			expect(isSemanticOnlyInstruction('module')).toBe(true);
			expect(isSemanticOnlyInstruction('const')).toBe(true);
			expect(isSemanticOnlyInstruction('use')).toBe(true);
			expect(isSemanticOnlyInstruction('init')).toBe(true);
		});

		it('returns false for runtime/codegen instructions', () => {
			expect(isSemanticOnlyInstruction('push')).toBe(false);
			expect(isSemanticOnlyInstruction('int')).toBe(false);
			expect(isSemanticOnlyInstruction('store')).toBe(false);
		});
	});
}
