import isArrayDeclarationInstruction from './isArrayDeclarationInstruction';

const scalarMemoryDeclarationInstructions = new Set([
	'int',
	'float',
	'int*',
	'int**',
	'int16*',
	'int16**',
	'float*',
	'float**',
	'float64',
	'float64*',
	'float64**',
]);

export default function isMemoryDeclarationInstruction(instruction: string): boolean {
	return scalarMemoryDeclarationInstructions.has(instruction) || isArrayDeclarationInstruction(instruction);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isMemoryDeclarationInstruction', () => {
		it('returns true for scalar memory declaration instructions', () => {
			expect(isMemoryDeclarationInstruction('int')).toBe(true);
			expect(isMemoryDeclarationInstruction('float')).toBe(true);
			expect(isMemoryDeclarationInstruction('float64')).toBe(true);
			expect(isMemoryDeclarationInstruction('int*')).toBe(true);
			expect(isMemoryDeclarationInstruction('int**')).toBe(true);
			expect(isMemoryDeclarationInstruction('int16*')).toBe(true);
			expect(isMemoryDeclarationInstruction('int16**')).toBe(true);
			expect(isMemoryDeclarationInstruction('float*')).toBe(true);
			expect(isMemoryDeclarationInstruction('float**')).toBe(true);
			expect(isMemoryDeclarationInstruction('float64*')).toBe(true);
			expect(isMemoryDeclarationInstruction('float64**')).toBe(true);
		});

		it('returns true for array memory declaration instructions', () => {
			expect(isMemoryDeclarationInstruction('int[]')).toBe(true);
			expect(isMemoryDeclarationInstruction('float[]')).toBe(true);
			expect(isMemoryDeclarationInstruction('float64[]')).toBe(true);
			expect(isMemoryDeclarationInstruction('int8[]')).toBe(true);
			expect(isMemoryDeclarationInstruction('int16[]')).toBe(true);
			expect(isMemoryDeclarationInstruction('int32[]')).toBe(true);
			expect(isMemoryDeclarationInstruction('int*[]')).toBe(true);
			expect(isMemoryDeclarationInstruction('float*[]')).toBe(true);
			expect(isMemoryDeclarationInstruction('float64*[]')).toBe(true);
		});

		it('returns false for non-declaration instructions', () => {
			expect(isMemoryDeclarationInstruction('push')).toBe(false);
			expect(isMemoryDeclarationInstruction('const')).toBe(false);
			expect(isMemoryDeclarationInstruction('module')).toBe(false);
			expect(isMemoryDeclarationInstruction('store')).toBe(false);
		});
	});
}
