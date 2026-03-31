const arrayDeclarationInstructionPattern =
	/^(?:float(?:\*{1,2})?|float64(?:\*{1,2})?|int(?:8u?|16u?|32|\*{1,2})?)\[\]$/;

export default function isArrayDeclarationInstruction(instruction: string): boolean {
	return arrayDeclarationInstructionPattern.test(instruction);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isArrayDeclarationInstruction', () => {
		it('matches supported array declaration instructions', () => {
			expect(isArrayDeclarationInstruction('int[]')).toBe(true);
			expect(isArrayDeclarationInstruction('int8[]')).toBe(true);
			expect(isArrayDeclarationInstruction('int8u[]')).toBe(true);
			expect(isArrayDeclarationInstruction('int16[]')).toBe(true);
			expect(isArrayDeclarationInstruction('int16u[]')).toBe(true);
			expect(isArrayDeclarationInstruction('int32[]')).toBe(true);
			expect(isArrayDeclarationInstruction('int*[]')).toBe(true);
			expect(isArrayDeclarationInstruction('int**[]')).toBe(true);
			expect(isArrayDeclarationInstruction('float[]')).toBe(true);
			expect(isArrayDeclarationInstruction('float*[]')).toBe(true);
			expect(isArrayDeclarationInstruction('float**[]')).toBe(true);
			expect(isArrayDeclarationInstruction('float64[]')).toBe(true);
			expect(isArrayDeclarationInstruction('float64*[]')).toBe(true);
			expect(isArrayDeclarationInstruction('float64**[]')).toBe(true);
		});

		it('rejects unsupported declaration instructions', () => {
			expect(isArrayDeclarationInstruction('int16*[]')).toBe(false);
			expect(isArrayDeclarationInstruction('bool[]')).toBe(false);
			expect(isArrayDeclarationInstruction('int')).toBe(false);
		});
	});
}
