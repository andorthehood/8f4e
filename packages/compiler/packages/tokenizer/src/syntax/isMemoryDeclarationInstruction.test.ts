import { describe, expect, it } from 'vitest';

import isMemoryDeclarationInstruction from './isMemoryDeclarationInstruction';

describe('isMemoryDeclarationInstruction', () => {
	it('returns true for scalar memory declaration instructions', () => {
		expect(isMemoryDeclarationInstruction('int')).toBe(true);
		expect(isMemoryDeclarationInstruction('float')).toBe(true);
		expect(isMemoryDeclarationInstruction('float64')).toBe(true);
		expect(isMemoryDeclarationInstruction('int*')).toBe(true);
		expect(isMemoryDeclarationInstruction('int**')).toBe(true);
		expect(isMemoryDeclarationInstruction('int8*')).toBe(true);
		expect(isMemoryDeclarationInstruction('int8**')).toBe(true);
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
